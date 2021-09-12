import React, { useEffect, useRef, useState } from 'react';
import './css/index.css';

import { initializeApp } from "firebase/app";
import { getFirestore, onSnapshot, collection, getDocs, addDoc, query, limit, serverTimestamp, limitToLast, orderBy } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

import { useAuthState } from 'react-firebase-hooks/auth';

initializeApp({
  apiKey: "AIzaSyATCuBTozCInAe0X6wWaRq_itEG9e2kc-k",
  authDomain: "firechat-7c037.firebaseapp.com",
  projectId: "firechat-7c037",
  storageBucket: "firechat-7c037.appspot.com",
  messagingSenderId: "398346986392",
  appId: "1:398346986392:web:62998603180bcb4fe8c1ed",
  measurementId: "G-H1C5ZR9MPF" 
}); 

const _auth = getAuth();
const _db = getFirestore();

function App() {
  const [user] = useAuthState(_auth)
  return (
    <div className="App bg-black h-screen text-white p-10">
      <div className="w-2/4 mx-auto">
        <header className="bg-blue-900 p-4">
          💬 Hello Fire Chat!
          <SignOut />  
        </header>
        <div className="p-4 bg-white text-black">
          {
            user ? <ChatRoom /> : <SignIn />
          }  
        </div> 
      </div>
    </div>
  );
}

const SignIn = () => {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(_auth, provider)
  }

  return (
    <button className="bg-blue-900 text-white py-2 px-4 mx-auto block" onClick={ signInWithGoogle }>Sign in with Google</button>
  )
}

const SignOut = () => {
  return _auth.currentUser && (
    <button className="float-right text-sm" onClick={ () => { _auth.signOut() } }>Sign Out</button>
  )
}

const loadMessage = (message, setMessage) => {
  const messageQuery = query(collection(_db, 'message'), orderBy('createdAt'), limitToLast(25));

  onSnapshot(messageQuery, (snapshot) => {
    setMessage( snapshot.docs );
  })
}

const ChatRoom = () => {
  const [messageValue, setMessageValue] = useState('');
  const [message, setMessage] = useState([]);
  const scroll = useRef();

  const user = _auth.currentUser;
  const {uid, displayName, photoURL, email} = user;

  useEffect(() => {
    loadMessage(message, setMessage);
  }, [])

  const sendMessage = async (e) => {
    e.preventDefault();
    const newMessageRef = await addDoc(collection(_db, 'message'), {
      message: messageValue,
      createdAt: serverTimestamp(),
      uid,
      displayName,
      photoURL,
      email
    }) 
    
    setMessageValue('');
    if( scroll && scroll.current )
      scroll.current.scrollIntoView();
  }

  return (
    <>
      <p className="text-sm">Hello <a href="#" title={uid}>{ displayName }</a>,</p>
      {
        message.length > 0 &&
        <ul style={ { 'max-height': '70vh', 'min-height': '30vh' } } className="my-4 border-t-2 border-b-2 py-2 border-gray-300 overflow-auto">
          {
            message.map( doc => {
              let data = doc.data();
              return <ChatMessage key={doc.id} data={data} />
            } )
          }
          <li ref={scroll}></li>
        </ul>
        
      }
      <form onSubmit={sendMessage} className="mt-4">
        <input className="border border-black mr-2" onChange={ (e) => {
          setMessageValue(e.target.value)
        } } value={messageValue} />
        <button type="submit" className="bg-black text-white">Send Message</button>
      </form>
    </>
  )
}

const ChatMessage = ( { data } ) => {
  const currentUser = _auth.currentUser.uid;
  let {displayName, photoURL, message, uid, createdAt} = data
  return (
    <li className={ ['flex', 'mb-4', (currentUser == uid) ? 'flex-row-reverse text-right' : ''].join(' ') }>
      <div className={ ['w-8', (currentUser == uid) ? 'ml-3' : 'mr-3'].join(' ') }>
        <img src={photoURL} alt={displayName} title={displayName} className={ ['w-full', 'rounded-full'].join(' ') } />
      </div>
      <div className="" style={ { 'max-width': '75%' } }>
        <div className="text-sm text-gray-400 mb-1">{ displayName }</div>
        <div className="bg-gray-100 p-2 px-4 rounded-sm">{ message }</div>
      </div>
    </li>
  )
}

export default App;
