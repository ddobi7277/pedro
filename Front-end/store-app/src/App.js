import React ,{useEffect, useState} from 'react';
import './App.css';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Create from './components/Create';
import Login from './components/Login';
import Welcome from './components/Welcome';
import Edit from './components/Edit';

function App() {
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    const ws = new WebSocket('wss://equity-limitation-terry-provider.trycloudflare.com/ws');
    setSocket(ws);
    return () => {
      ws.close();
    };
  }, []);
  useEffect(() => {
    if (!socket) return;

    socket.onopen = function (event) {
        console.log("WebSocket connected");
    };

    socket.onmessage = function (event) {
        console.log("Received message:", event.data);
    };

    socket.onclose = function (event) {
        console.log("WebSocket closed");
    };

    return () => {
        socket.close();
    };
}, [socket]);

  return (
    <div className="wrapper">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element= {<Dashboard />}/>
          <Route path='/edit'  element= {<Edit />}/>
          <Route path='/create' element= {<Create />}/>
          </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
