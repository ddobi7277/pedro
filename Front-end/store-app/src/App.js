import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Create from './components/Create';
import Login from './components/Login';
import Welcome from './components/Welcome';
import Edit from './components/Edit';
import Sales from './components/Sales';
import CreatUser from './components/CreateUser';
import PublicStore from './components/PublicStore'; // Import new component

function App() {

  return (
    <div className="wrapper">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path='/edit' element={<Edit />} />
          <Route path='/create' element={<Create />} />
          <Route path='/sales' element={<Sales />} />
          <Route path='/createUser' element={<CreatUser />} />
          <Route path='/store/:seller' element={<PublicStore />} /> {/* New public store route */}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
