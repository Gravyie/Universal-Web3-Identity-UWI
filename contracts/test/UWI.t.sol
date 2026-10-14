// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {UWIRegistry} from "../src/UWIRegistry.sol";
import {UWIGates} from "../src/UWIGates.sol";

contract UWITest is Test {
    UWIRegistry reg;
    UWIGates gates;

    address owner = makeAddr("owner");
    address attestor = makeAddr("attestor");
    uint256 alicePk = 0xA11CE;
    address alice = vm.addr(alicePk);
    uint256 bobPk = 0xB0B;
    address bob = vm.addr(bobPk);
    address relayer = makeAddr("relayer");

    bytes32 constant ALICE_HUMAN = keccak256("alice-passport");
    bytes32 constant BOB_HUMAN = keccak256("bob-passport");

    function setUp() public {
        vm.warp(1_800_000_000);
        reg = new UWIRegistry(owner, attestor);
        gates = new UWIGates(reg);
    }

    function _issue(address to, string memory name, bytes32 human, UWIRegistry.Proof proof)
        internal
        returns (uint256)
    {
        vm.prank(attestor);
        return reg.issue(to, name, human, proof);
    }

    // ── Registry ────────────────────────────────────────────────────────────

    function test_IssueStoresCredential() public {
        uint256 id = _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self);
        assertEq(id, 1);
        assertEq(reg.ownerOf(id), alice);
        assertTrue(reg.isVerifiedHuman(alice));
        assertTrue(reg.isVerifiedHumanStrict(alice));
        assertEq(reg.humanCount(), 1);
        (address holder, uint256 tid) = reg.resolveUsername("alice");
        assertEq(holder, alice);
        assertEq(tid, 1);
        assertTrue(reg.locked(id));
    }

    function test_OnlyAttestorIssues() public {
        vm.expectRevert(UWIRegistry.NotAttestor.selector);
        reg.issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self);
    }

    function test_SameHumanCannotRegisterTwice() public {
        _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self);
        vm.prank(attestor);
        vm.expectRevert(abi.encodeWithSelector(UWIRegistry.HumanAlreadyRegistered.selector, 1));
        reg.issue(bob, "alice_alt", ALICE_HUMAN, UWIRegistry.Proof.Self);
    }

    function test_WalletCannotHoldTwo() public {
        _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self);
        vm.prank(attestor);
        vm.expectRevert(abi.encodeWithSelector(UWIRegistry.AlreadyHolder.selector, alice));
        reg.issue(alice, "other", BOB_HUMAN, UWIRegistry.Proof.Self);
    }

    function test_UsernamesAreUniqueAndValidated() public {
        _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self);
        assertFalse(reg.usernameAvailable("alice"));
        assertFalse(reg.usernameAvailable("Alice"));
        assertFalse(reg.usernameAvailable("ab"));
        assertFalse(reg.usernameAvailable("has space"));
        assertTrue(reg.usernameAvailable("bob_42"));

        vm.startPrank(attestor);
        vm.expectRevert(UWIRegistry.UsernameTaken.selector);
        reg.issue(bob, "alice", BOB_HUMAN, UWIRegistry.Proof.Self);
        vm.expectRevert(UWIRegistry.InvalidUsername.selector);
        reg.issue(bob, "Bob", BOB_HUMAN, UWIRegistry.Proof.Self);
        vm.stopPrank();
    }

    function test_Soulbound() public {
        uint256 id = _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self);
        vm.startPrank(alice);
        vm.expectRevert(UWIRegistry.Soulbound.selector);
        reg.transferFrom(alice, bob, id);
        vm.expectRevert(UWIRegistry.Soulbound.selector);
        reg.approve(bob, id);
        vm.expectRevert(UWIRegistry.Soulbound.selector);
        reg.setApprovalForAll(bob, true);
        vm.stopPrank();
    }

    function test_RecoverMovesCredential() public {
        uint256 id = _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self);
        address newWallet = makeAddr("alice-new");
        vm.prank(attestor);
        assertEq(reg.recover(ALICE_HUMAN, newWallet), id);
        assertEq(reg.ownerOf(id), newWallet);
        assertEq(reg.tokenOf(alice), 0);
        assertEq(reg.tokenOf(newWallet), id);
        assertEq(reg.humanCount(), 1);
        // Still soulbound afterwards.
        vm.prank(newWallet);
        vm.expectRevert(UWIRegistry.Soulbound.selector);
        reg.transferFrom(newWallet, alice, id);
    }

    function test_RevokeFreesHumanAndUsername() public {
        uint256 id = _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self);
        vm.prank(alice);
        reg.revoke(id);
        assertFalse(reg.isVerifiedHuman(alice));
        assertTrue(reg.usernameAvailable("alice"));
        assertEq(reg.humanCount(), 0);
        _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self); // can verify again
    }

    function test_RevokeBySig() public {
        uint256 id = _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self);
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 structHash =
            keccak256(abi.encode(keccak256("Revoke(uint256 tokenId,uint256 nonce,uint256 deadline)"), id, 0, deadline));
        bytes memory sig = _sign(alicePk, reg.DOMAIN_SEPARATOR(), structHash);
        bytes memory forged = _sign(bobPk, reg.DOMAIN_SEPARATOR(), structHash);

        vm.prank(relayer);
        vm.expectRevert(UWIRegistry.InvalidSignature.selector);
        reg.revokeBySig(id, deadline, forged);

        vm.prank(relayer);
        reg.revokeBySig(id, deadline, sig);
        assertEq(reg.tokenOf(alice), 0);
    }

    function test_StrictExcludesDemo() public {
        _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Demo);
        assertTrue(reg.isVerifiedHuman(alice));
        assertFalse(reg.isVerifiedHumanStrict(alice));
    }

    function test_TokenUri() public {
        uint256 id = _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self);
        string memory uri = reg.tokenURI(id);
        assertEq(bytes(uri).length > 100, true);
    }

    // ── Gates ───────────────────────────────────────────────────────────────

    function _params(string memory name) internal pure returns (UWIGates.GateParams memory) {
        return UWIGates.GateParams({name: name, description: "test", closesAt: 0, capacity: 0, strict: false});
    }

    function test_CreatorMustBeHuman() public {
        vm.prank(alice);
        vm.expectRevert(UWIGates.NotVerifiedHuman.selector);
        gates.createGate(_params("Drop"));
    }

    function test_JoinOncePerHuman() public {
        _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self);
        _issue(bob, "bob", BOB_HUMAN, UWIRegistry.Proof.Self);
        vm.prank(alice);
        uint256 g = gates.createGate(_params("Drop"));

        vm.prank(bob);
        gates.join(g);
        vm.prank(bob);
        vm.expectRevert(UWIGates.AlreadyJoined.selector);
        gates.join(g);

        // Recovering to a new wallet doesn't buy a second entry.
        address bobNew = makeAddr("bob-new");
        vm.prank(attestor);
        reg.recover(BOB_HUMAN, bobNew);
        vm.prank(bobNew);
        vm.expectRevert(UWIGates.AlreadyJoined.selector);
        gates.join(g);

        assertEq(gates.getGate(g).memberCount, 1);
        assertTrue(gates.hasJoined(g, bobNew));
        UWIGates.Member[] memory m = gates.members(g, 0, 10);
        assertEq(m.length, 1);
        assertEq(m[0].account, bob);
    }

    function test_UnverifiedCannotJoin() public {
        _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self);
        vm.prank(alice);
        uint256 g = gates.createGate(_params("Drop"));
        vm.prank(bob);
        vm.expectRevert(UWIGates.NotVerifiedHuman.selector);
        gates.join(g);
    }

    function test_StrictGateRejectsDemo() public {
        _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self);
        _issue(bob, "bob", BOB_HUMAN, UWIRegistry.Proof.Demo);
        UWIGates.GateParams memory p = _params("Strict");
        p.strict = true;
        vm.prank(alice);
        uint256 g = gates.createGate(p);
        vm.prank(bob);
        vm.expectRevert(UWIGates.DemoProofNotAccepted.selector);
        gates.join(g);
    }

    function test_CapacityAndClosing() public {
        _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self);
        _issue(bob, "bob", BOB_HUMAN, UWIRegistry.Proof.Self);
        UWIGates.GateParams memory p = _params("Tiny");
        p.capacity = 1;
        p.closesAt = uint64(block.timestamp + 1 days);
        vm.prank(alice);
        uint256 g = gates.createGate(p);

        vm.prank(alice);
        gates.join(g);
        vm.prank(bob);
        vm.expectRevert(UWIGates.GateFull.selector);
        gates.join(g);

        vm.prank(bob);
        vm.expectRevert(UWIGates.NotCreator.selector);
        gates.close(g);

        vm.prank(alice);
        uint256 g2 = gates.createGate(p);
        vm.warp(block.timestamp + 2 days);
        vm.prank(bob);
        vm.expectRevert(UWIGates.GateClosedError.selector);
        gates.join(g2);
    }

    function test_GaslessCreateAndJoin() public {
        _issue(alice, "alice", ALICE_HUMAN, UWIRegistry.Proof.Self);
        _issue(bob, "bob", BOB_HUMAN, UWIRegistry.Proof.Self);
        uint256 deadline = block.timestamp + 1 hours;
        UWIGates.GateParams memory p = _params("Gasless");

        bytes32 createHash = keccak256(
            abi.encode(
                keccak256(
                    "CreateGate(address creator,string name,string description,uint64 closesAt,uint32 capacity,bool strict,uint256 nonce,uint256 deadline)"
                ),
                alice,
                keccak256(bytes(p.name)),
                keccak256(bytes(p.description)),
                p.closesAt,
                p.capacity,
                p.strict,
                0,
                deadline
            )
        );
        vm.prank(relayer);
        uint256 g = gates.createGateBySig(alice, p, deadline, _sign(alicePk, gates.DOMAIN_SEPARATOR(), createHash));
        assertEq(gates.getGate(g).creator, alice);

        bytes32 joinHash = keccak256(
            abi.encode(
                keccak256("JoinGate(uint256 gateId,address account,uint256 nonce,uint256 deadline)"),
                g,
                bob,
                0,
                deadline
            )
        );
        bytes memory sig = _sign(bobPk, gates.DOMAIN_SEPARATOR(), joinHash);
        vm.prank(relayer);
        gates.joinBySig(g, bob, deadline, sig);
        assertTrue(gates.hasJoined(g, bob));

        // Replay fails: the nonce moved on.
        vm.prank(relayer);
        vm.expectRevert(UWIGates.InvalidSignature.selector);
        gates.joinBySig(g, bob, deadline, sig);

        uint256[] memory joined = gates.gatesJoinedBy(bob);
        assertEq(joined.length, 1);
        assertEq(gates.gatesCreatedBy(alice)[0], g);
    }

    function test_ExpiredSignature() public {
        _issue(bob, "bob", BOB_HUMAN, UWIRegistry.Proof.Self);
        vm.expectRevert(UWIGates.SignatureExpired.selector);
        gates.joinBySig(1, bob, block.timestamp - 1, "");
    }

    function _sign(uint256 pk, bytes32 domain, bytes32 structHash) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, keccak256(abi.encodePacked("\x19\x01", domain, structHash)));
        return abi.encodePacked(r, s, v);
    }
}
