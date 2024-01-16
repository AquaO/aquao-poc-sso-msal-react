import React, { useState } from 'react';
import { PublicClientApplication } from "@azure/msal-browser";
import './global.css';

function App() {

  const [isMsalLoading, setMsalLoading] = useState(false);  
  const [isAquaoLoading, setAquaoLoading] = useState(false);
  const [maslData, setMaslData] = useState({
    tenantId : null,
    clientId : null,
    token : null
  });
  const [userContext, setUserContext] = useState(null);

  const msalConfig = {
    auth: {
      clientId: process.env.REACT_APP_AD_CLIENT_ID,
      authority: "https://login.microsoftonline.com/" + process.env.REACT_APP_AD_TENANT_ID,
    },
    cache: {
      cacheLocation: "localStorage",
      storeAuthStateInCookie: false,
    },
    graph: {
    }
  };

  const handleOnClick = async (e) => {

    setMsalLoading(true);

    const msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();

    let msalLoginRequest = {
      scopes: [
      ],
    };

    let response = await msalInstance.loginPopup(msalLoginRequest);
    maslData.tenantId = response.account.idTokenClaims.tid;
    maslData.clientId = response.account.idTokenClaims.aud;
    maslData.token = response.idToken;

    setMaslData(maslData);
    setMsalLoading(false);

    setAquaoLoading(true);
    response = await fetch(process.env.REACT_APP_AQUAO_END_POINT_BASE + "/api/security/authentication-support/msal/logas",
      { 
        method: 'POST', 
        redirect: 'follow', // Follow 302 response from AquaO
        headers: {
          "Content-Type" : "application/json"
        },
        referrerPolicy: "no-referrer",
        cache: "no-cache", 
        cors: "no-cors",
        credentials: 'include',
        body: JSON.stringify(maslData)
      }
    );

    setUserContext(await response.json());
    setAquaoLoading(false);
  }

  return (
    <div className="page-authentication">

      <button onClick={handleOnClick}> 
        <i className="fa fa-windows"></i> Authenticate with Office 365
      </button>

      <MsalAuthenticationViewer 
        loading={isMsalLoading} 
        maslData ={maslData} 
      />

      <AquaoAuthenticationViewer 
        loading={isAquaoLoading} 
        userContext ={userContext} 
      />

    </div>
  );
}

/**
 * 
 * @returns 
 */
function AuthenticationViewer(props){
  return (
    <div className="authentificationViewer">
      <h2>{props.value ? props.value : ""}</h2>
      {props.children}
    </div>
  );
}

/**
 * 
 * @param {boolean} loading 
 * @param {object} maslData
 * @returns 
 */
function MsalAuthenticationViewer(props){

  const title = "Microsoft Authentication Library";

  if(props.loading){

    return (
      <AuthenticationViewer value={title}>
        <Loader value="loading ..." />
      </AuthenticationViewer>
    );

  } else if(props.maslData.tenantId == null){

    return (
      <AuthenticationViewer value={title}>
        <p className="informations">Unknown status</p>
      </AuthenticationViewer>
    );

  } else {

    return (
      <AuthenticationViewer value={title}>
        <table>
          <tbody>
            <tr>
              <td className="left">MsalAuthenticationRequest</td>
              <td colSpan="3"><textarea value={JSON.stringify(props.maslData, null, "\t")} readOnly={true} /></td>
            </tr>
            <tr>
              <td className="left">TenantId</td>
              <td>{props.maslData.tenantId}</td>
              <td className="left">ClientId</td>
              <td>{props.maslData.clientId}</td>
            </tr>
            <tr>
              <td className="left">Token</td>
              <td colSpan="3"><textarea value={props.maslData.token} readOnly={true} /></td>
            </tr>
          </tbody>
        </table>
      </AuthenticationViewer>
    );

  }
}

/**
 * 
 * @param {boolean} loading 
 * @param {object} userContext 
 * @returns 
 */
function AquaoAuthenticationViewer(props){

  const title = "AquaO";

  if(props.loading){

    return (      
      <AuthenticationViewer value={title}>
        <Loader value="loading ..." />
      </AuthenticationViewer>
    );

  } else if(props.userContext == null){
    
    return (
      <AuthenticationViewer value={title}>
        <p className="informations">Unknown status</p>
      </AuthenticationViewer>
    );

  } else {

    let authenticated = props.userContext.authenticated;
    let name = props.userContext.name;
    let email = authenticated ? props.userContext.principal.email : "no-email";

    return (
      <AuthenticationViewer value={title}>
        <table>
          <tbody>
            <tr>
              <td className="left">User Context</td>
              <td className="right">
                <strong>{ authenticated ? "Authenticated" : "Anonymous" } </strong>
                <br/>
                Known as <i><strong>{ name }</strong> - { email }</i> 
              </td>
            </tr>
          </tbody>
        </table>
      </AuthenticationViewer>
    );
  }
}

/**
 * 
 * @param {Object} props 
 */
function Loader(props){
  return (
    <div className="loader">
      <div className="spinner"></div>
      <p>{props.value ? props.value : ""}</p>
    </div>
  );
}
export default App;
