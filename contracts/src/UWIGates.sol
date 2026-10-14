// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {UWIRegistry} from "./UWIRegistry.sol";

/// @title UWI Gates
/// @notice Sybil-proof lists: allowlists, waitlists, sign-ups and polls of
/// unique humans. A gate admits each *credential* once, so a person can't join
/// twice from different wallets — and moving a credential during recovery
/// doesn't let it join again either.
///
/// Every write has a `…BySig` twin so a relayer can pay gas on the user's behalf.
contract UWIGates is EIP712, Nonces {
    struct Gate {
        address creator;
        uint64 createdAt;
        uint64 closesAt; // 0 = open until closed
        uint32 capacity; // 0 = unlimited
        uint32 memberCount;
        bool strict; // only Self-backed credentials, no demo proofs
        bool closed;
        string name;
        string description;
    }

    struct Member {
        address account;
        uint256 tokenId;
        uint64 joinedAt;
    }

    struct GateParams {
        string name;
        string description;
        uint64 closesAt;
        uint32 capacity;
        bool strict;
    }

    bytes32 private constant CREATE_TYPEHASH = keccak256(
        "CreateGate(address creator,string name,string description,uint64 closesAt,uint32 capacity,bool strict,uint256 nonce,uint256 deadline)"
    );
    bytes32 private constant JOIN_TYPEHASH =
        keccak256("JoinGate(uint256 gateId,address account,uint256 nonce,uint256 deadline)");
    bytes32 private constant CLOSE_TYPEHASH =
        keccak256("CloseGate(uint256 gateId,address creator,uint256 nonce,uint256 deadline)");

    UWIRegistry public immutable registry;

    Gate[] private _gates;
    mapping(uint256 => Member[]) private _members;
    mapping(uint256 => mapping(uint256 => bool)) public joinedByToken;
    mapping(address => uint256[]) private _createdBy;
    mapping(uint256 => uint256[]) private _joinedByToken;

    event GateCreated(uint256 indexed gateId, address indexed creator, string name);
    event GateJoined(uint256 indexed gateId, uint256 indexed tokenId, address indexed account);
    event GateClosed(uint256 indexed gateId);

    error NotVerifiedHuman();
    error DemoProofNotAccepted();
    error UnknownGate();
    error GateClosedError();
    error GateFull();
    error AlreadyJoined();
    error NotCreator();
    error InvalidParams();
    error SignatureExpired();
    error InvalidSignature();

    constructor(UWIRegistry registry_) EIP712("UWI Gates", "1") {
        registry = registry_;
    }

    // ── Create ──────────────────────────────────────────────────────────────

    function createGate(GateParams calldata p) external returns (uint256) {
        return _create(msg.sender, p);
    }

    function createGateBySig(address creator, GateParams calldata p, uint256 deadline, bytes calldata signature)
        external
        returns (uint256)
    {
        _checkSig(
            creator,
            keccak256(
                abi.encode(
                    CREATE_TYPEHASH,
                    creator,
                    keccak256(bytes(p.name)),
                    keccak256(bytes(p.description)),
                    p.closesAt,
                    p.capacity,
                    p.strict,
                    _useNonce(creator),
                    deadline
                )
            ),
            deadline,
            signature
        );
        return _create(creator, p);
    }

    /// @dev Creators must be verified humans too — it's what keeps the relayer from being spammed.
    function _create(address creator, GateParams calldata p) private returns (uint256 gateId) {
        if (!registry.isVerifiedHuman(creator)) revert NotVerifiedHuman();
        uint256 nameLen = bytes(p.name).length;
        if (nameLen == 0 || nameLen > 64 || bytes(p.description).length > 280) revert InvalidParams();
        if (p.closesAt != 0 && p.closesAt <= block.timestamp) revert InvalidParams();

        _gates.push(
            Gate({
                creator: creator,
                createdAt: uint64(block.timestamp),
                closesAt: p.closesAt,
                capacity: p.capacity,
                memberCount: 0,
                strict: p.strict,
                closed: false,
                name: p.name,
                description: p.description
            })
        );
        gateId = _gates.length;
        _createdBy[creator].push(gateId);
        emit GateCreated(gateId, creator, p.name);
    }

    // ── Join ────────────────────────────────────────────────────────────────

    function join(uint256 gateId) external {
        _join(gateId, msg.sender);
    }

    function joinBySig(uint256 gateId, address account, uint256 deadline, bytes calldata signature) external {
        _checkSig(
            account,
            keccak256(abi.encode(JOIN_TYPEHASH, gateId, account, _useNonce(account), deadline)),
            deadline,
            signature
        );
        _join(gateId, account);
    }

    function _join(uint256 gateId, address account) private {
        Gate storage g = _gate(gateId);
        if (g.closed || (g.closesAt != 0 && block.timestamp >= g.closesAt)) revert GateClosedError();
        if (g.capacity != 0 && g.memberCount >= g.capacity) revert GateFull();

        uint256 tokenId = registry.tokenOf(account);
        if (tokenId == 0) revert NotVerifiedHuman();
        if (g.strict && !registry.isVerifiedHumanStrict(account)) revert DemoProofNotAccepted();
        if (joinedByToken[gateId][tokenId]) revert AlreadyJoined();

        joinedByToken[gateId][tokenId] = true;
        g.memberCount++;
        _members[gateId].push(Member({account: account, tokenId: tokenId, joinedAt: uint64(block.timestamp)}));
        _joinedByToken[tokenId].push(gateId);
        emit GateJoined(gateId, tokenId, account);
    }

    // ── Close ───────────────────────────────────────────────────────────────

    function close(uint256 gateId) external {
        _close(gateId, msg.sender);
    }

    function closeBySig(uint256 gateId, address creator, uint256 deadline, bytes calldata signature) external {
        _checkSig(
            creator,
            keccak256(abi.encode(CLOSE_TYPEHASH, gateId, creator, _useNonce(creator), deadline)),
            deadline,
            signature
        );
        _close(gateId, creator);
    }

    function _close(uint256 gateId, address caller) private {
        Gate storage g = _gate(gateId);
        if (g.creator != caller) revert NotCreator();
        g.closed = true;
        emit GateClosed(gateId);
    }

    // ── Views ───────────────────────────────────────────────────────────────

    function gateCount() external view returns (uint256) {
        return _gates.length;
    }

    function getGate(uint256 gateId) external view returns (Gate memory) {
        return _gate(gateId);
    }

    function members(uint256 gateId, uint256 offset, uint256 limit) external view returns (Member[] memory page) {
        _gate(gateId);
        Member[] storage all = _members[gateId];
        if (offset >= all.length) return page;
        uint256 end = offset + limit > all.length ? all.length : offset + limit;
        page = new Member[](end - offset);
        for (uint256 i = offset; i < end; ++i) {
            page[i - offset] = all[i];
        }
    }

    function gatesCreatedBy(address creator) external view returns (uint256[] memory) {
        return _createdBy[creator];
    }

    function gatesJoinedBy(address account) external view returns (uint256[] memory) {
        uint256 tokenId = registry.tokenOf(account);
        return tokenId == 0 ? new uint256[](0) : _joinedByToken[tokenId];
    }

    function hasJoined(uint256 gateId, address account) external view returns (bool) {
        uint256 tokenId = registry.tokenOf(account);
        return tokenId != 0 && joinedByToken[gateId][tokenId];
    }

    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // ── Internals ───────────────────────────────────────────────────────────

    function _gate(uint256 gateId) private view returns (Gate storage) {
        if (gateId == 0 || gateId > _gates.length) revert UnknownGate();
        return _gates[gateId - 1];
    }

    function _checkSig(address signer, bytes32 structHash, uint256 deadline, bytes calldata signature) private view {
        if (block.timestamp > deadline) revert SignatureExpired();
        if (!SignatureChecker.isValidSignatureNow(signer, _hashTypedDataV4(structHash), signature)) {
            revert InvalidSignature();
        }
    }
}
