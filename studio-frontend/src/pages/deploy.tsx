import PageLayout from "../components/PageLayout";
// import OuterSidebar from "../components/OuterSidebar";
import { IndexedDb } from "../db/ProjectsDB";
import { useEffect, useState } from "react";
// import DeployInnerSidebar from "../components/DeployInnerSidebar";
import { Project } from "../types/project-types";
// import DeployHeader from "../components/DeployHeader";
// import DeployCanvas from "../components/DeployCanvas";
// import ScaleLoader from "react-spinners/ScaleLoader";
// import { SPINNER_COLORS } from '../utils/theme';
// import Joyride from 'react-joyride';
import axios from "axios";
// import { network } from "../utils/network";
import Header from "../components/Header";
import DeploySidebar from "../components/DeploySidebar";
import DeployCanvas from "../components/DeployCanvas";



const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:80/';

const GAS_BUDGET = 40000;

export interface DeployedPackageInfo {
  id: string,
  name: string, 
  address: string | undefined
}



function DeployPage() {

  const [projectList, setProjectList] = useState<string[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [compileError, setCompileError] = useState<string>('');
  const [deployedModules, setDeployedModules] = useState<string[]>([]);
  const [deployedObjects, setDeployedObjects] = useState<DeployedPackageInfo[]>([]);
  // const { connected, getAccounts, signAndExecuteTransaction } = useWallet();
  // const wallet = useWallet()
  // console.log('chain', wallet.chain)
  // console.log('chains', wallet.chains)

  const [toasts, setToasts] = useState<JSX.Element | undefined>();
  // const [transaction, setTransaction] = useState<(JSX.Element | undefined)>();

  const [isOverlayActive, setIsOverlayActive] = useState<boolean>(false);
  const [runTutorial, setRunTutorial] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Alert the user if they leave the page when they have deployed objects in the session
  useEffect(() => {
    if (deployedObjects.length === 0) return;
    window.onbeforeunload = function() {
      return ""
    }
  }, [deployedObjects])

  useEffect(() => {
    console.log('toasts', toasts);
  }, [toasts]);

  // useEffect(() => {
  //   if (localStorage.getItem('preferredSuiWallet') === 'Suiet') {
  //     alert('Suiet wallet is curently not supported in this version of Move Studio IDE, please use Sui (recommended) or Martian wallet');
  //     return;
  //   }

  //   if(wallet.connected && runTutorial && stepIndex === 1) {
  //     setStepIndex(2);
  //   }
  // }, [wallet.connected])

  useEffect(() => {
    if (runTutorial && stepIndex === 2 && currentProject?.package === 'demoPackage') {
      setStepIndex(3);
    }
}, [currentProject])

  // Initialize indexedDb
  let indexedDb: IndexedDb;
  useEffect(() => {
    const startIndexDb = async () => {
      indexedDb = new IndexedDb('test');
      await indexedDb.createObjectStore(['projects'], {keyPath: 'package'});
    }

    const existingUser = localStorage.getItem('user-deploy');
    console.log('existingUser', existingUser);
    if (!existingUser) {
      localStorage.setItem('user-deploy', 'true');
      startTutorial();
    }

    startIndexDb().then(() => {
      getProjects();
    });
  }, []);

  //---Helpers---//

  // TODO: Figure out how to clear the current project when tutorial is started
  const startTutorial = () => {

    console.log('startTutorial');

    // if (!connected) {
    //   alert('Please connect your Sui wallet to continue with the tutorial. (Note: the Suiet wallet is currently not supported)')
    //   return;
    // }

    handleProjectChange('**default');
    setDeployedObjects([]);

    // setRunTutorial(true);
    // setStepIndex(0);
  }

  const resetCache = () => {
    const confirmReset = window.confirm("This will clear all of your projects and reset the demo project. Press OK to continue.")

    if (confirmReset === false) {
      alert('Reset cancelled.')
      return;
    }

    localStorage.clear();
    window.location.reload();
  }

  const getProjects = async () => {
    indexedDb = new IndexedDb('test');
    await indexedDb.createObjectStore(['projects'], {keyPath: 'package'});
    // console.log('db', indexedDb);
    const allProjects = await indexedDb.getAllKeys('projects');
    console.log('projectList', allProjects);
    setProjectList(allProjects);
  }

  const getProjectData = async (project: string) => {
    indexedDb = new IndexedDb('test');
    await indexedDb.createObjectStore(['projects'], {keyPath: 'package'});
    const projectData = await indexedDb.getValue('projects', project);
    setCurrentProject(projectData);
    // console.log('projectData', projectData);
    // return projectData;
  }

  const setPendingTxn = () => {
    setToasts(
      <div className="alert alert-info">
        <div>
          {/* <ScaleLoader
            color={SPINNER_COLORS[theme].infoContent}
            height={20}
            // width={15}
          /> */}
          <span className="normal-case" style={{color: 'hsl(var(--inc))'}} >Waiting for transaction...</span>
        </div>
      </div>
    )
  }

  const setSuccessTxn = (digest: string) => {

    const id = Math.random().toString();

    setToasts(
      // [
        <div className="alert alert-success" id={id}>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Successful transaction</span>
            {/* <a href={`https://explorer.sui.io/transaction/${digest}?network=${network[wallet.chain?.name || 'Sui Devnet']}`} target="_blank" rel="noopener noreferrer">
              <button>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="butt" stroke-linejoin="round"><g fill="none" fill-rule="evenodd"><path d="M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8c0-1.1.9-2 2-2h5M15 3h6v6M10 14L20.2 3.8"/></g></svg>
              </button>
            </a> */}
            <a>
              <button onClick={() => setToasts(undefined)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="butt" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </a>
          </div>
        </div>
      // ]
    )

    // setTransaction(
    //   <div className="card " >
    //     <div className="card-body">
    //     </div>
    //   </div>
    // )


  }

  const setFailTxn = (digest: string) => {

    const id = Math.random().toString();

    if (digest == '') {
      setToasts(
        <div className="alert alert-error" id={id}>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Transaction failed</span>
            <a>
              <button onClick={() => setToasts(undefined)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="butt" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </a>
          </div>
        </div>
      )
    } else if (digest == 'Wallet not connected') {
      setToasts(
        <div className="alert alert-error" id={id}>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Wallet not connected</span>
            <a>
              <button onClick={() => setToasts(undefined)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="butt" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </a>
          </div>
        </div>
      )
    } else {
      setToasts(
        // [
          <div className="alert alert-error" id={id}>
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Transaction failed</span>
              {/* <a href={`https://explorer.sui.io/transaction/${digest}?network=${network[wallet.chain?.name || 'Sui Devnet']}`} target="_blank" rel="noopener noreferrer">
                <button >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="butt" stroke-linejoin="round"><g fill="none" fill-rule="evenodd"><path d="M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8c0-1.1.9-2 2-2h5M15 3h6v6M10 14L20.2 3.8"/></g></svg>
                </button>
              </a> */}
              <a>
                <button onClick={() => setToasts(undefined)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="butt" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </a>
            </div>
          </div>
        // ]
      )
    }
  }
          
  //---Handlers---//

  const handleProjectChange = (projectChange: string) => {

    if (projectChange === '**default') {
      setCurrentProject(null);
      console.log('default');
    } else if (projectChange === 'addProject') {
      setCurrentProject(null);
      console.log('addProject');
      const addToIndexdb = async (newProjectName: string) => {
        indexedDb = new IndexedDb('test');
        await indexedDb.createObjectStore(['projects'], {keyPath: 'package'});
        await indexedDb.putValue('projects', {
          package: newProjectName,
          dependencies: [
            {name: newProjectName, address: '0x0'},
            {name: 'Sui', address: '0x02'}
          ],
          modules: []
        });
      }
      const newProjectName = prompt('Enter project name');
      console.log('newProjectName', newProjectName)

      if (!newProjectName) {
        return;
      }

      // Make sure project name is unique
      if (projectList.find(projectName => projectName === newProjectName)) {
        alert('Project name already exists');
        return;
      }

      // Make sure project name starts with a letter
      if (!newProjectName.match(/^[a-zA-Z]/)) {
        alert('Project name must start with a letter');
        return;
      }

      // Make sure project name is alphanumeric
      if (!newProjectName.match(/^[a-zA-Z0-9]+$/)) {
        alert('Project name must be alphanumeric');
        return;
      }

      addToIndexdb(newProjectName).then(() => {
        getProjects();
      });
      
      // getProjectData(newProjectName || 'project1');
    } else {
      console.log('newProject', projectChange);
      getProjectData(projectChange);
      console.log('currentProject', currentProject);
    }

    setCompileError('');
  }

  const handlePackagePublish = () => {

    console.log(localStorage.getItem('preferredSuiWallet'));
    if (localStorage.getItem('preferredSuiWallet') === 'Suiet') {
      alert('Suiet wallet is curently not supported in this version of Move Studio IDE, please use Sui (recommended) or Martian wallet');
      return;
    }

    if (runTutorial && stepIndex === 3) {
      setStepIndex(4);
    }

    setIsOverlayActive(true);

    const id1 = Math.random().toString();
    const id2 = Math.random().toString();
    
    setToasts(
      // [
        <div className="alert alert-info" id={id1}>
          <div>
            {/* <button className="btn  btn-xs"> */}
            {/* <ScaleLoader
              color={SPINNER_COLORS[theme].infoContent}
              height={20}
              // width={15}
            /> */}
            {/* </button> */}
            <span className="normal-case" style={{color: 'hsl(var(--inc))'}}>Publishing...</span>
            <button onClick={() => setToasts(undefined)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="butt" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      // ]
    )

    if (!currentProject) {
      return;
    }

    // get compiled modules
    const compileCode = async () => {
      if (!currentProject) {
        return;
      }
      return axios.post(`${BACKEND_URL}compile`, currentProject).then((res) => {
        const compileResults = res.data as string | string[];
        console.log('res', compileResults);
        return compileResults;
      });
    }
    // compileCode();

    // const callPublish = async (compiledModules: string[]) => {

    //   const publishData = {
    //     compiledModules: compiledModules,
    //     gasBudget: GAS_BUDGET
    //   }
  
    //   console.log('publishData', publishData);

    //   try {
    //     const publishTxn = await wallet.signAndExecuteTransaction({
    //       transaction: {
    //         kind: 'publish',
    //         data: {
    //           compiledModules: compiledModules,
    //           gasBudget: GAS_BUDGET,
    //         }
    //       }
    //     });
  
    //     return publishTxn;
    //   } catch (error: any) {
    //     console.log('error', error.message);

    //     if (error.message.includes("Cannot find gas coin for signer address") || error.message.includes("SUI balance is insufficient to pay for gasBudget")) {
    //       setToasts(
    //         <div className="alert alert-error" id={id2}>
    //           <div>
    //             <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    //             <span>Insufficient gas</span>
    //             <button onClick={() => setToasts(undefined)}>
    //               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="butt" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    //             </button>
    //           </div>
    //         </div>
    //       );
    //     } else if (error.message.includes("Transaction rejected from user")) {
    //       setToasts(
    //         <div className="alert alert-error" id={id2}>
    //           <div>
    //             <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    //             <span>Rejected</span>
    //             <button onClick={() => setToasts(undefined)}>
    //               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="butt" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    //             </button>
    //           </div>
    //         </div>
    //       );
    //     } else if (error.message.includes("Wallet Not Connected") || error.message.includes("wallet not connected")) {
    //       setToasts(
    //         <div className="alert alert-error" id={id2}>
    //           <div>
    //             <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    //             <span>Wallet not connected</span>
    //             <button onClick={() => setToasts(undefined)}>
    //               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="butt" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    //             </button>
    //           </div>
    //         </div>
    //       );
    //     } else {
    //       setToasts(
    //         <div className="alert alert-error" id={id2}>
    //           <div>
    //             <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    //             <span>Publication fail</span>
    //             <button onClick={() => setToasts(undefined)}>
    //               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="butt" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    //             </button>
    //           </div>
    //         </div>
    //       );
    //     }
    //   }
    // }

    // compileCode().then((res) => {

    //   if (res == undefined) {
    //     return;
    //   }

    //   if (typeof res === 'string') {
    //     setCompileError(res);
    //     setToasts(
    //       <div className="alert alert-error" id={id2}>
    //         <div>
    //           <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    //           <span>Package compile error</span>
    //           <button onClick={() => setToasts(undefined)}>
    //             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="butt" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    //           </button>
    //         </div>
    //       </div>
    //     );
    //     return;
    //   }

    //   if (res.length === 0) {
    //     setCompileError('No modules to publish');
    //     setToasts(
    //       <div className="alert alert-error" id={id2}>
    //         <div>
    //           <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    //           <span>Empty package</span>
    //           <button onClick={() => setToasts(undefined)}>
    //             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="butt" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    //           </button>
    //         </div>
    //       </div>
    //     );
    //     return;
    //   }

    //   setCurrentProject(null)

    //   callPublish(res).then((res) => {
    //     console.log('res', res);

    //     if (res == undefined) {
    //       return;
    //     }

    //     const publishTxnDigest = res.certificate.transactionDigest;

    //     const publishTxnCreated = res.effects.created || (res.effects as any).effects.created as OwnedObjectRef[] || [];

    //     console.log('res', res)
    //     console.log('publishTxnCreated', publishTxnCreated);
    //     console.log('publishTxnDigest', publishTxnDigest);

    //     const packageInfos = publishTxnCreated?.map((object: { reference: { objectId: any; }; }) => {
    //       return {id: Math.random().toString(36).slice(2), name: currentProject.package, address: object.reference.objectId};
    //     });

    //     if (!packageInfos) {
    //       return;
    //     }

    //     if (publishTxnCreated) {
    //       setDeployedObjects([...deployedObjects, ...packageInfos]);
    //     }

    //     setToasts(
    //       // [
    //         // ...toasts,
    //         <div className="alert alert-success" id={id2}>
    //           <div>
    //             <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    //             <span>Successful publication</span>
    //             <a href={`https://explorer.sui.io/transaction/${publishTxnDigest}?network=${network[wallet.chain?.name || 'Sui Devnet']}`} target="_blank" rel="noopener noreferrer">
    //               <button >
    //                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="butt" stroke-linejoin="round"><g fill="none" fill-rule="evenodd"><path d="M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8c0-1.1.9-2 2-2h5M15 3h6v6M10 14L20.2 3.8"/></g></svg>
    //               </button>
    //             </a>
    //             <button onClick={() => setToasts(undefined)}>
    //               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="butt" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    //             </button>
    //           </div>
    //         </div>
    //       // ]
    //     );
        
    //   });
    // });
    // setIsOverlayActive(false);
  }

  const addExistingObject = (objectId: string) => {

    if (runTutorial && stepIndex === 7) {
      setStepIndex(stepIndex + 1);
    }

    const manualPackageName = prompt('Enter name of existing package. (Leave blank if object)')
    const existingObject = {id: Math.random().toString(36).slice(2), name: manualPackageName || 'manual', address: objectId};
    setDeployedObjects([...deployedObjects, existingObject]);
  }

  // Remove the specific object from the deployedObjects array
  const removeDeployedObject = async (objectId: string) => {
    await setIsOverlayActive(true);
    setDeployedObjects(
      [
        ...deployedObjects.filter((object) => {
          return object.id !== objectId;
        }) 
      ]
    );
    setIsOverlayActive(false);
  }

  const rearrangeDeployedObjects = async (movedObjectId: string, targetObjectId: string) => {
    await setIsOverlayActive(true);

    for (let i = 0; i < deployedObjects.length; i++) {
      console.log('looking for moved object', deployedObjects[i].id, movedObjectId)
      if (deployedObjects[i].id === movedObjectId) {
        console.log('found moved object', i, movedObjectId)
        const movedObject = deployedObjects[i];
        for (let j = 0; j < deployedObjects.length; j++) {
          console.log('looking for target object', deployedObjects[j].id, targetObjectId)
          if (deployedObjects[j].id === targetObjectId) {
            console.log('found target object', j, targetObjectId)
            deployedObjects.splice(i, 1);
            setDeployedObjects(
              [
                ...deployedObjects.slice(0, j),
                movedObject,
                ...deployedObjects.slice(j)
              ]
            )
            return 

          } 
        }
      }
    }

    // console.log('uh oh')
  }


  return (
    <div className="tutorial-deploy-header">
      {/* <Joyride
        // tooltipComponent={Tooltip}
        run={runTutorial}
        steps={steps as any[]}
        continuous={true}
        // showProgress={true}
        // showSkipButton={true}
        debug={true}
        disableOverlayClose={true}
        stepIndex={stepIndex}
        spotlightClicks={true}
        callback={tutorialCallback}
        showSkipButton={true}
        styles={{
            options: {
              arrowColor: 'hsl(var(--b2))',
              backgroundColor: 'hsl(var(--b2))',
              overlayColor: 'hsl(var(--b3))',
              // primaryColor: 'hsl(var(--inc))',
              textColor: `hsl(var(--n${SPINNER_COLORS[theme].scheme === 'light' ? '' : 'c'}))`,
              // width: 900,
              zIndex: 1000,
            }, 
            tooltip: {
              borderRadius: "25px"
            },
            buttonNext: {
              backgroundColor: 'hsl(var(--su))',
              color: 'hsl(var(--suc))',
              borderRadius: "15px",
              fontSize: "1rem"
            },
            buttonBack: {
              backgroundColor: 'hsl(var(--wa))',
              color: 'hsl(var(--wac))',
              borderRadius: "15px",
              fontSize: "1rem"
            },
            buttonClose: {
              // backgroundColor: 'hsl(var(--er))',
              // color: 'hsl(var(--erc))',
              // borderRadius: "15px",
              // fontSize: "1rem"
            },
            buttonSkip: {
              backgroundColor: 'hsl(var(--er))',
              color: 'hsl(var(--erc))',
              borderRadius: "15px",
              fontSize: "1rem"
            },
            
          }}
      /> */}
      <PageLayout
        // page="deploy"
        header={
          <Header/>
        }
        sidebar={
          <DeploySidebar
            projectList={projectList}
            currentProject={currentProject}
            changeProject={handleProjectChange}
            publishPackage={handlePackagePublish}
            addExistingObject={addExistingObject}
            compileError={compileError}
          />
        }
        canvas={
          <DeployCanvas
            deployedObjects={deployedObjects}
            toasts={toasts}
            isOverlayActive={isOverlayActive}
            setIsOverlayActive={setIsOverlayActive}
            setPendingTxn={setPendingTxn}
            setSuccessTxn={setSuccessTxn}
            setFailTxn={setFailTxn}
            removeDeployedObject={removeDeployedObject}
            rearrangeDeployedObjects={rearrangeDeployedObjects}
          />
        }
        // canvas={
        //   <div/>
        // }
      />
    </div>
  );
}

export default DeployPage;