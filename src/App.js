import React, { useState } from 'react';
import './App.css';
import SUCCESS from './data/images/y.png';
import FAILURE from './data/images/n.png';
import YSRCP from './data/images/logos/YSRCP.png';
import TDP from './data/images/logos/TDP.png';
import JNSN from './data/images/logos/JNSN.png';
import BJP from './data/images/logos/BJP.png';
import INC from './data/images/logos/INC.png';
var sha256 = require('js-sha256');
var pbkdf2 = require('pbkdf2');
var aesjs = require('aes-js');
const NodeRSA = require('node-rsa');
var registry = require('./data/registry.json')
var parties = require('./data/elections/parties.json')
var partyLogos;

var candidates0;

var election;
var candidates;
var constituencies;

var voteScreen = 0;
var selectedElectiionId;
var selectedConstituencyId;
var selectedCandidateId;
var voterAadharId;

var voteResult = {
  icon: SUCCESS,
  desc: "",
  reason: "",
  digink: ""
};

function useForceUpdate(){
  const [value, setValue] = useState(0); // integer state
  return () => setValue(value => ++value); // update the state to force render
}

function populatePartyLogos() {
  parties["YSRCP"].partyLogo = YSRCP;
  parties["TDP"].partyLogo = TDP;
  parties["JNSN"].partyLogo = JNSN;
  parties["BJP"].partyLogo = BJP;
  parties["INC"].partyLogo = INC;
}

function populateConstituencies(fu, electionId) {
  console.log("Populate constituncies: " + electionId);
  
  try {
    election = require('./data/elections/' + electionId + '.json')
    constituencies = election.map((election, i) =>  
      <li key={i} onClick={() => populateCandidates(fu, election.contituencyId)}>
        <div className="page-section-vote-election-list-item">
          <div className="page-section-vote-election-list-item-hashtag">{election.contituencyId}<span className="page-section-vote-election-list-item-state"> • {election.stateName}</span></div>
          <div className="page-section-vote-election-list-item-title">{election.contituencyName}</div>
        </div>      
      </li>  
    );  
    voteScreen = 1;
    selectedElectiionId = electionId;
    fu();
  } catch(e) { }
}

function populateCandidates(fu, contituencyId) {
  console.log("Populate candidates: " + contituencyId);

  for (var i=0; i<election.length; i++) { 
    if (election[i].contituencyId != contituencyId) continue;
    candidates0 = election[i].candidates;
    candidates = candidates0.map((candidates) =>  
      <li key={candidates.candidateId} onClick={() => populateVoterIdScreen(fu, candidates.candidateId)}>
        <div className="page-section-vote-election-list-item" id="page-section-vote-election-list-item-candidate">
        <div className="page-section-vote-election-list-item-logo" style={{ backgroundImage: `url(${parties[candidates.partyId].partyLogo})`, backgroundPosition: 'center', backgroundSize: '100%', backgroundRepeat: 'no-repeat'}}></div>
          <div className="page-section-vote-election-list-item-hashtag">{candidates.candidateId}</div>
          <div className="page-section-vote-election-list-item-party">{parties[candidates.partyId].partyName}</div>
          <div className="page-section-vote-election-list-item-title" id="page-section-vote-election-list-item-candidate-name">{candidates.candidateName}</div>
        </div>      
      </li>  
    );  
    break;
  }
  voteScreen = 2;
  selectedConstituencyId = contituencyId;
  fu();
}

function populateVoterIdScreen(fu, candidateId) {
  console.log("Populate aadhar screen: ", candidateId);
  voteScreen = 3;
  selectedCandidateId = candidateId;
  fu();
}

function populateSubmittingScreen(fu) {

  if (!voterAadharId || voterAadharId.length != 12) {
    alert("Please enter a valid 12 digit Aadhar Id.")
    return;
  }

  voteScreen = 4;
  fu();

  var vote = {
    electionId: selectedElectiionId,
    constituencyId: selectedConstituencyId,
    candidateId: selectedCandidateId,
    voterFingerprint: sha256(voterAadharId)
  }
  console.log("Submit vote: ");
  console.log(JSON.stringify(vote));

  submitVote(vote, 0, fu);  
}

function updateVoterAadharId (x) {
  voterAadharId = x;
}
function App() {

  populatePartyLogos();
  const forceUpdate = useForceUpdate();

  //Elections
  var electionsList = require('./data/elections/electionsIndex.json')
  const elections = electionsList.map((electionsList) =>  
    <li key={electionsList.id} onClick={() => populateConstituencies(forceUpdate, electionsList.id)}>
      <div className="page-section-vote-election-list-item">
        <div className="page-section-vote-election-list-item-hashtag">{electionsList.id}<span className="page-section-vote-election-list-item-finished">{electionsList.ongoing ? "" : " • FINISHED"}</span></div>
        <div className="page-section-vote-election-list-item-title">{electionsList.name}</div>
      </div>      
    </li>  
  );  
  
  return (
    <div className="page" id="page-vote">
      <div className="page-wrapper">
        <div className="page-section" id="page-section-info">
          <div className="page-section-info-wrapper">
            <h1>Open Elect.</h1>
            <p>Digital, Decentralized and Open Voting System. Based on Blockchain Technology.</p>
            <p className="repo">Github: <a href="https://github.com/AshishGogna/oe-protocol" target="_blank">https://github.com/AshishGogna/oe-protocol</a></p>
          </div>
          <a href="#page-section-header-vote"><div className="page-section-info-vote-button">Cast your Vote</div></a>
        </div>
        <div className="page-section" id="page-section-vote">
          <div className="page-section-vote-wrapper">
            <div className="page-section-header" id="page-section-header-vote">
              <span className="page-section-header-title">Caste Your Vote.</span>
            </div>

            <ul className="page-section-vote-election-list" hidden={voteScreen!=0}>
              <div className="page-section-vote-election-list-title">Select Elections</div>
              {elections}
            </ul>

            <ul className="page-section-vote-election-list" hidden={voteScreen!=1}>
              <div className="page-section-vote-election-list-title">Select Constituency</div>
              {constituencies}
            </ul>

            <ul className="page-section-vote-election-list" id="page-section-vote-election-list-candidate" hidden={voteScreen!=2}>
              <div className="page-section-vote-election-list-title">Select Candidate</div>
              {candidates}
            </ul>

            <div className="page-section-vote-auth" hidden={voteScreen!=3}>
              <div className="page-section-vote-election-list-title">Authorize</div>
              <div className="page-section-vote-auth-aadhar-input-title">Enter your Aadhar Id</div>
              <input className="page-section-vote-auth-aadhar-input" type="number" onInput={e => updateVoterAadharId(e.target.value)} pattern="\d*" max="2" placeholder="XXXX XXXX XXXX"></input>
              <button className="page-section-vote-auth-aadhar-input" onClick={() => populateSubmittingScreen(forceUpdate)}>VOTE</button>
              <div className="page-section-vote-election-list-auth-info">Aadhar verification will be bypassed for testing purposes.</div>
            </div>

            <div className="page-section-vote-auth" hidden={voteScreen!=4}>
              <div className="page-section-vote-election-list-title">Submitting Vote</div>
              <div className="page-section-vote-auth-aadhar-submitting-title">Your vote is being submitted</div>
              <div class="loader"></div>
            </div>

            <div className="page-section-vote-result" hidden={voteScreen!=5}>
              <div className="page-section-vote-election-result-status" style={{ backgroundImage: `url(${voteResult.icon})`, backgroundPosition: 'center', backgroundSize: '100%', backgroundRepeat: 'no-repeat'}}></div>
              <div className="page-section-vote-auth-aadhar-result-title">{voteResult.desc}</div>
              <div className="page-section-vote-auth-aadhar-result-desc">{voteResult.reason}<span className="page-section-vote-election-result-digink">{voteResult.digink}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function encrypt(pwd, data) {
  var key = pbkdf2.pbkdf2Sync(pwd, 'salt', 1, 128 / 8, 'sha512');
  var text = data;
  var textBytes = aesjs.utils.utf8.toBytes(text);
  var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
  var encryptedBytes = aesCtr.encrypt(textBytes);
  var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
  return encryptedHex;
}

function decrypt(pwd, data) {
  var key = pbkdf2.pbkdf2Sync(pwd, 'salt', 1, 128 / 8, 'sha512');
  var encryptedBytes = aesjs.utils.hex.toBytes(data);
  var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
  var decryptedBytes = aesCtr.decrypt(encryptedBytes);
  var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
  return decryptedText;
}

function submitVote(vote, i, fu) {
  var requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vote)
  };
  fetch(registry.nodes[i], requestOptions)
  .then(response => response.json())
  .then(response => {
      console.log("Node response:");
      console.log(response)

      if (response.status.code != 200) {
        i = i + 1;
        if (i < registry.nodes.length) submitVote(vote, i, fu);
        else {
          var r = "";
          voteResult = {
            icon: FAILURE,
            desc: "Vote Submission Falied!",
            reason: r,
            digink: ""
          };
          voteScreen = 5;
          fu();
        }
      }
      else {
        voteResult = {
          icon: SUCCESS,
          desc: "Vote Submitted!",
          reason: "Here's your digital receipt: ",
          digink: response.payload.voteHash
        };
        voteScreen = 5;
        fu();
      }
  })
  .catch(error => {
    console.log("Node error:");
    console.log(error);
  });
}

export default App;
