import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';

export default function Welcome() {

  const navigate= useNavigate();

  const handleLoginNavigation= () => {
    navigate('/login');
  }
  return(
    <div>  
    <h2>Welcome</h2>
    <Button variant='contained' onClick={handleLoginNavigation}>Login</Button>
    </div>
  
  );
}