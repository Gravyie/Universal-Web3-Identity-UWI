// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title UWI Registry
/// @notice Soulbound proof-of-personhood credentials. One human → one credential.
///
/// Humans are identified by a *nullifier*: a value Self derives from the
/// passport/ID and the app scope. It reveals nothing about the document, but
/// the same document always yields the same nullifier — so a second wallet
/// can't register the same person.
///
/// Self proofs are verified off-chain by an attestor (Self's hub contracts
/// live on Celo, not Hedera). The attestor submits `issue`, which also makes
/// issuance gasless for users. Losing a wallet isn't fatal: proving again from
/// a new wallet lets the attestor `recover` the same credential onto it.
contract UWIRegistry is ERC721, Ownable, EIP712, Nonces {
    using Strings for uint256;

    enum Proof {
        Self,
        Demo
    }

    struct Credential {
        string username;
        uint64 issuedAt;
        uint64 updatedAt;
        Proof proof;
        bytes32 nullifier;
    }

    bytes32 private constant REVOKE_TYPEHASH = keccak256("Revoke(uint256 tokenId,uint256 nonce,uint256 deadline)");

    uint256 private _nextId = 1;
    uint256 public humanCount;

    mapping(address => bool) public isAttestor;
    mapping(uint256 => Credential) private _credentials;
    mapping(address => uint256) public tokenOf;
    mapping(bytes32 => uint256) public tokenOfNullifier;
    mapping(bytes32 => uint256) private _tokenOfUsername;

    /// @dev Set only while the attestor moves a credential during recovery.
    bool private _recovering;

    event AttestorSet(address indexed attestor, bool enabled);
    event CredentialIssued(uint256 indexed tokenId, address indexed holder, string username, Proof proof);
    event CredentialRecovered(uint256 indexed tokenId, address indexed from, address indexed to);
    event CredentialRevoked(uint256 indexed tokenId, address indexed holder);
    /// @dev ERC-5192: emitted once per token; credentials are always locked.
    event Locked(uint256 tokenId);

    error NotAttestor();
    error Soulbound();
    error AlreadyHolder(address account);
    error HumanAlreadyRegistered(uint256 tokenId);
    error UnknownHuman();
    error InvalidUsername();
    error UsernameTaken();
    error NotHolder();
    error SignatureExpired();
    error InvalidSignature();

    modifier onlyAttestor() {
        if (!isAttestor[msg.sender]) revert NotAttestor();
        _;
    }

    constructor(address initialOwner, address attestor)
        ERC721("Universal Web3 Identity", "UWI")
        Ownable(initialOwner)
        EIP712("UWI Registry", "1")
    {
        isAttestor[attestor] = true;
        emit AttestorSet(attestor, true);
    }

    // ── Admin ───────────────────────────────────────────────────────────────

    function setAttestor(address attestor, bool enabled) external onlyOwner {
        isAttestor[attestor] = enabled;
        emit AttestorSet(attestor, enabled);
    }

    // ── Attestor ────────────────────────────────────────────────────────────

    /// @notice Issue a credential to `to` for the human behind `nullifier`.
    function issue(address to, string calldata username, bytes32 nullifier, Proof proof)
        external
        onlyAttestor
        returns (uint256 tokenId)
    {
        if (tokenOf[to] != 0) revert AlreadyHolder(to);
        uint256 existing = tokenOfNullifier[nullifier];
        if (existing != 0) revert HumanAlreadyRegistered(existing);
        bytes32 nameKey = _usernameKey(username);
        if (_tokenOfUsername[nameKey] != 0) revert UsernameTaken();

        tokenId = _nextId++;
        _credentials[tokenId] = Credential({
            username: username,
            issuedAt: uint64(block.timestamp),
            updatedAt: uint64(block.timestamp),
            proof: proof,
            nullifier: nullifier
        });
        tokenOf[to] = tokenId;
        tokenOfNullifier[nullifier] = tokenId;
        _tokenOfUsername[nameKey] = tokenId;
        humanCount++;

        _mint(to, tokenId);
        emit Locked(tokenId);
        emit CredentialIssued(tokenId, to, username, proof);
    }

    /// @notice Move a human's credential to a new wallet after they proved again from it.
    function recover(bytes32 nullifier, address to) external onlyAttestor returns (uint256 tokenId) {
        tokenId = tokenOfNullifier[nullifier];
        if (tokenId == 0) revert UnknownHuman();
        if (tokenOf[to] != 0) revert AlreadyHolder(to);

        address from = _ownerOf(tokenId);
        delete tokenOf[from];
        tokenOf[to] = tokenId;
        _credentials[tokenId].updatedAt = uint64(block.timestamp);

        _recovering = true;
        _transfer(from, to, tokenId);
        _recovering = false;

        emit CredentialRecovered(tokenId, from, to);
    }

    // ── Holder ──────────────────────────────────────────────────────────────

    /// @notice Burn your own credential. Frees the username and lets you verify again later.
    function revoke(uint256 tokenId) external {
        if (_ownerOf(tokenId) != msg.sender) revert NotHolder();
        _revoke(tokenId, msg.sender);
    }

    /// @notice Gasless revoke: the holder signs, anyone (the relayer) submits.
    function revokeBySig(uint256 tokenId, uint256 deadline, bytes calldata signature) external {
        if (block.timestamp > deadline) revert SignatureExpired();
        address holder = _ownerOf(tokenId);
        if (holder == address(0)) revert NotHolder();
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(REVOKE_TYPEHASH, tokenId, _useNonce(holder), deadline)));
        if (!SignatureChecker.isValidSignatureNow(holder, digest, signature)) revert InvalidSignature();
        _revoke(tokenId, holder);
    }

    function _revoke(uint256 tokenId, address holder) private {
        Credential storage c = _credentials[tokenId];
        delete _tokenOfUsername[_usernameKey(c.username)];
        delete tokenOfNullifier[c.nullifier];
        delete tokenOf[holder];
        delete _credentials[tokenId];
        humanCount--;
        _burn(tokenId);
        emit CredentialRevoked(tokenId, holder);
    }

    // ── Views ───────────────────────────────────────────────────────────────

    /// @notice True for any live credential, including demo ones on testnet.
    function isVerifiedHuman(address account) external view returns (bool) {
        return tokenOf[account] != 0;
    }

    /// @notice True only for credentials backed by a real Self proof.
    function isVerifiedHumanStrict(address account) external view returns (bool) {
        uint256 id = tokenOf[account];
        return id != 0 && _credentials[id].proof == Proof.Self;
    }

    function getCredential(uint256 tokenId) external view returns (Credential memory) {
        _requireOwned(tokenId);
        return _credentials[tokenId];
    }

    function credentialOf(address account) external view returns (uint256 tokenId, Credential memory credential) {
        tokenId = tokenOf[account];
        if (tokenId != 0) credential = _credentials[tokenId];
    }

    function resolveUsername(string calldata username) external view returns (address holder, uint256 tokenId) {
        tokenId = _tokenOfUsername[keccak256(bytes(username))];
        if (tokenId != 0) holder = _ownerOf(tokenId);
    }

    /// @notice Valid format and not yet taken.
    function usernameAvailable(string calldata username) external view returns (bool) {
        if (!_isValidUsername(bytes(username))) return false;
        return _tokenOfUsername[keccak256(bytes(username))] == 0;
    }

    function totalIssued() external view returns (uint256) {
        return _nextId - 1;
    }

    function nonces(address owner) public view override returns (uint256) {
        return super.nonces(owner);
    }

    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /// @notice ERC-5192: every credential is permanently locked to its holder.
    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }

    // ── Soulbound enforcement ───────────────────────────────────────────────

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0) && !_recovering) revert Soulbound();
        return super._update(to, tokenId, auth);
    }

    function approve(address, uint256) public pure override {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert Soulbound();
    }

    // ── Usernames ───────────────────────────────────────────────────────────

    /// @dev 3–24 chars of [a-z0-9_]. Lowercase only, so keys are canonical.
    function _isValidUsername(bytes memory b) private pure returns (bool) {
        if (b.length < 3 || b.length > 24) return false;
        for (uint256 i; i < b.length; ++i) {
            bytes1 c = b[i];
            bool ok = (c >= 0x61 && c <= 0x7a) || (c >= 0x30 && c <= 0x39) || c == 0x5f;
            if (!ok) return false;
        }
        return true;
    }

    function _usernameKey(string memory username) private pure returns (bytes32) {
        if (!_isValidUsername(bytes(username))) revert InvalidUsername();
        return keccak256(bytes(username));
    }

    // ── Metadata ────────────────────────────────────────────────────────────

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        Credential memory c = _credentials[tokenId];
        string memory proof = c.proof == Proof.Self ? "Self" : "Demo";
        string memory json = string.concat(
            '{"name":"UWI #',
            tokenId.toString(),
            " @",
            c.username,
            '","description":"Soulbound proof-of-personhood credential. Verified once, recognised everywhere.",',
            '"image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(_svg(tokenId, c, proof))),
            '","attributes":[{"trait_type":"Username","value":"',
            c.username,
            '"},{"trait_type":"Proof","value":"',
            proof,
            '"},{"display_type":"date","trait_type":"Issued","value":',
            uint256(c.issuedAt).toString(),
            "}]}"
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function _svg(uint256 tokenId, Credential memory c, string memory proof) private pure returns (string memory) {
        string memory hue = (uint256(c.nullifier) % 360).toString();
        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 400" font-family="ui-monospace,monospace">',
            '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(',
            hue,
            ',70%,94%)"/><stop offset="1" stop-color="hsl(',
            hue,
            ',60%,82%)"/></linearGradient></defs>',
            '<rect width="620" height="400" rx="28" fill="url(#g)"/>',
            '<g fill="none" stroke="hsl(',
            hue,
            ',45%,40%)" stroke-opacity=".25">',
            '<circle cx="500" cy="200" r="150"/><circle cx="500" cy="200" r="120"/><circle cx="500" cy="200" r="90"/></g>',
            '<text x="40" y="70" font-size="26" font-weight="700" fill="#1a1a1f">UWI</text>',
            '<text x="40" y="230" font-size="44" fill="#1a1a1f">@',
            c.username,
            "</text>",
            '<text x="40" y="350" font-size="16" fill="#1a1a1f" fill-opacity=".6">#',
            tokenId.toString(),
            " / VERIFIED HUMAN / ",
            proof,
            "</text></svg>"
        );
    }
}
