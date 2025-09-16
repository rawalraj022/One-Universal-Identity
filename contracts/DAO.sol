// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title OUI DAO Governance Contract
/// @notice Manages proposals and voting for One Universal Identity upgrades

contract OUIDAO {
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 voteCount;
        uint256 startTime;
        uint256 endTime;
        bool executed;
    }

    uint256 public proposalCounter;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public votes;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string description, uint256 startTime, uint256 endTime);
    event Voted(uint256 indexed proposalId, address indexed voter);
    event ProposalExecuted(uint256 indexed proposalId);

    modifier proposalExists(uint256 proposalId) {
        require(proposals[proposalId].startTime != 0, "Proposal does not exist");
        _;
    }

    /// @notice Create a new proposal
    function createProposal(string calldata description, uint256 duration) external returns (uint256) {
        proposalCounter++;
        uint256 startTime = block.timestamp;
        uint256 endTime = block.timestamp + duration;
        proposals[proposalCounter] = Proposal({
            id: proposalCounter,
            proposer: msg.sender,
            description: description,
            voteCount: 0,
            startTime: startTime,
            endTime: endTime,
            executed: false
        });
        emit ProposalCreated(proposalCounter, msg.sender, description, startTime, endTime);
        return proposalCounter;
    }

    /// @notice Vote on a proposal
    function vote(uint256 proposalId) external proposalExists(proposalId) {
        require(block.timestamp < proposals[proposalId].endTime, "Voting period ended");
        require(!votes[proposalId][msg.sender], "Already voted");
        votes[proposalId][msg.sender] = true;
        proposals[proposalId].voteCount++;
        emit Voted(proposalId, msg.sender);
    }

    /// @notice Execute a proposal if voting period ended
    function executeProposal(uint256 proposalId) external proposalExists(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Already executed");
        proposal.executed = true;
        emit ProposalExecuted(proposalId);
        // Add upgrade logic here
    }

    /// @notice Get proposal details
    function getProposal(uint256 proposalId) external view proposalExists(proposalId) returns (
        address proposer,
        string memory description,
        uint256 voteCount,
        uint256 startTime,
        uint256 endTime,
        bool executed
    ) {
        Proposal memory proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.description,
            proposal.voteCount,
            proposal.startTime,
            proposal.endTime,
            proposal.executed
        );
    }
}