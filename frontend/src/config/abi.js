// Shared by the browser and the serverless functions in /api — keep this file
// free of Vite-only APIs (no import.meta.env).
import { parseAbi } from 'viem'

export const registryAbi = parseAbi([
  'struct Credential { string username; uint64 issuedAt; uint64 updatedAt; uint8 proof; bytes32 nullifier; }',
  'function issue(address to, string username, bytes32 nullifier, uint8 proof) returns (uint256)',
  'function recover(bytes32 nullifier, address to) returns (uint256)',
  'function revoke(uint256 tokenId)',
  'function revokeBySig(uint256 tokenId, uint256 deadline, bytes signature)',
  'function isVerifiedHuman(address account) view returns (bool)',
  'function isVerifiedHumanStrict(address account) view returns (bool)',
  'function getCredential(uint256 tokenId) view returns (Credential)',
  'function credentialOf(address account) view returns (uint256 tokenId, Credential credential)',
  'function resolveUsername(string username) view returns (address holder, uint256 tokenId)',
  'function usernameAvailable(string username) view returns (bool)',
  'function tokenOf(address account) view returns (uint256)',
  'function tokenOfNullifier(bytes32 nullifier) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function humanCount() view returns (uint256)',
  'function totalIssued() view returns (uint256)',
  'function nonces(address owner) view returns (uint256)',
  'function isAttestor(address account) view returns (bool)',
  'event CredentialIssued(uint256 indexed tokenId, address indexed holder, string username, uint8 proof)',
  'event CredentialRecovered(uint256 indexed tokenId, address indexed from, address indexed to)',
  'event CredentialRevoked(uint256 indexed tokenId, address indexed holder)',
  'error NotAttestor()',
  'error Soulbound()',
  'error AlreadyHolder(address account)',
  'error HumanAlreadyRegistered(uint256 tokenId)',
  'error UnknownHuman()',
  'error InvalidUsername()',
  'error UsernameTaken()',
  'error NotHolder()',
  'error SignatureExpired()',
  'error InvalidSignature()',
])

export const gatesAbi = parseAbi([
  'struct Gate { address creator; uint64 createdAt; uint64 closesAt; uint32 capacity; uint32 memberCount; bool strict; bool closed; string name; string description; }',
  'struct Member { address account; uint256 tokenId; uint64 joinedAt; }',
  'struct GateParams { string name; string description; uint64 closesAt; uint32 capacity; bool strict; }',
  'function createGate(GateParams p) returns (uint256)',
  'function createGateBySig(address creator, GateParams p, uint256 deadline, bytes signature) returns (uint256)',
  'function join(uint256 gateId)',
  'function joinBySig(uint256 gateId, address account, uint256 deadline, bytes signature)',
  'function close(uint256 gateId)',
  'function closeBySig(uint256 gateId, address creator, uint256 deadline, bytes signature)',
  'function gateCount() view returns (uint256)',
  'function getGate(uint256 gateId) view returns (Gate)',
  'function members(uint256 gateId, uint256 offset, uint256 limit) view returns (Member[])',
  'function gatesCreatedBy(address creator) view returns (uint256[])',
  'function gatesJoinedBy(address account) view returns (uint256[])',
  'function hasJoined(uint256 gateId, address account) view returns (bool)',
  'function nonces(address owner) view returns (uint256)',
  'event GateCreated(uint256 indexed gateId, address indexed creator, string name)',
  'event GateJoined(uint256 indexed gateId, uint256 indexed tokenId, address indexed account)',
  'event GateClosed(uint256 indexed gateId)',
  'error NotVerifiedHuman()',
  'error DemoProofNotAccepted()',
  'error UnknownGate()',
  'error GateClosedError()',
  'error GateFull()',
  'error AlreadyJoined()',
  'error NotCreator()',
  'error InvalidParams()',
  'error SignatureExpired()',
  'error InvalidSignature()',
])

export const PROOF = { self: 0, demo: 1 }

// EIP-712 typed data — must mirror the typehashes in the contracts.
export const typedData = {
  registryDomain: (chainId, verifyingContract) => ({ name: 'UWI Registry', version: '1', chainId, verifyingContract }),
  gatesDomain: (chainId, verifyingContract) => ({ name: 'UWI Gates', version: '1', chainId, verifyingContract }),
  types: {
    Revoke: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    CreateGate: [
      { name: 'creator', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'closesAt', type: 'uint64' },
      { name: 'capacity', type: 'uint32' },
      { name: 'strict', type: 'bool' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    JoinGate: [
      { name: 'gateId', type: 'uint256' },
      { name: 'account', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    CloseGate: [
      { name: 'gateId', type: 'uint256' },
      { name: 'creator', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  },
}

// Plain-language versions of every custom error, shared by API and UI.
export const ERROR_MESSAGES = {
  NotAttestor: 'The issuing service is not authorised on this registry.',
  Soulbound: 'Credentials are soulbound and cannot be transferred.',
  AlreadyHolder: 'This wallet already holds a credential.',
  HumanAlreadyRegistered: 'This person already has a credential on another wallet.',
  UnknownHuman: 'No credential exists for this person yet.',
  InvalidUsername: 'Usernames are 3 to 24 lowercase letters, numbers or underscores.',
  UsernameTaken: 'That username was just taken. Pick another one.',
  NotHolder: 'Only the holder can do that.',
  SignatureExpired: 'The signature expired. Please try again.',
  InvalidSignature: "The signature didn't match this wallet.",
  NotVerifiedHuman: 'You need a UWI credential first.',
  DemoProofNotAccepted: 'This gate only accepts credentials backed by a real Self proof.',
  UnknownGate: "This gate doesn't exist.",
  GateClosedError: 'This gate is closed.',
  GateFull: 'This gate is full.',
  AlreadyJoined: "You're already on this list.",
  NotCreator: 'Only the gate creator can do that.',
  InvalidParams: 'Check the gate details and try again.',
}

/** Signed by the wallet to request a testnet demo credential (see api/demo.js). */
export const demoMessage = ({ address, username, issuedAt }) =>
  `UWI · Create a demo credential\n\nUsername: @${username}\nWallet: ${address}\nIssued at: ${issuedAt}\n\nThis is a testnet demo. No passport is read.`
