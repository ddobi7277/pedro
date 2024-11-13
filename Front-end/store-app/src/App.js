import './App.css';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Create from './components/Create';
import Login from './components/Login';
import Welcome from './components/Welcome';
import Edit from './components/Edit';
import Sales from './components/Sales';

function App() {
  
  return (
    <div className="wrapper">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element= {<Dashboard />}/>
          <Route path='/edit'  element= {<Edit />}/>
          <Route path='/create' element= {<Create />}/>
          <Route path='/sales' element= {<Sales />}/>
          </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
