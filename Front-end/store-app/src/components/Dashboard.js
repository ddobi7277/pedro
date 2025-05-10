import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import ListItems from './ListItems';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';

export default function Dashboard() {
    console.log('is rendering')
    const navigate = useNavigate();
    const [data, setData] = useState([]);
 
    const [token, ] = useState(localStorage.getItem('token'));
    const [isLoaded, setIsLoaded] = useState(false);
    const [item,setItem] = useState({})
    const [selectedIndex, setSelectedIndex]= useState(-1)
    const [cant,setCant]= useState({})
    const [gender, setGender] = useState('Masculino')
    const [edit, setEdit] = useState(false)
    const [categoryList, setCategoryList] = useState(() => ['Aseo','Electrodomesticos']);
  

    const Card = styled(MuiCard)(({ theme }) => ({
      display: 'flex',
      flexDirection: 'column',
      alignSelf: 'center',
      width: '90%',
      height: '90%',
      padding: theme.spacing(4),
      gap: theme.spacing(2),
      margin: 'auto',
      [theme.breakpoints.up('sm')]: {
        maxWidth: '1120px',
      },
      boxShadow:
        'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
      ...theme.applyStyles('dark', {
        boxShadow:
          'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
      }),
    }));
    
       // const [promptShown, setPromptShown] = useState(false);
    const verifiToken = async () => {
      try{
          const response = await fetch(` https://reliably-communal-man.ngrok-free.app/verify-token/${token}`, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Authorization': 'Bearer ' + localStorage.getItem('token')
              },
      });
  
      if (response.ok) {
          setIsLoaded(true);
          const seller_iitem= await fetch(' https://reliably-communal-man.ngrok-free.app/get_seller_items',{
            method: 'GET',
            headers:{
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
          })
          const seller_items = await seller_iitem.json()
          setData(seller_items)
          setIsLoaded(true)
        } else {
          const errorData= await response.json();
          console.log(errorData)
          navigate('/login')
      }
      }catch (error){
          console.log(error)
          navigate('/login')
      }
      }
    

console.log('items:',data)
    useEffect(() => {
          (async () => {
            await verifiToken()
          })();
            console.log('data:',data)
            
    }, [token]);
  
/*     useEffect(() => {
        const timer = setTimeout(() => {
            if (!tasaCambio && !promptShown) {
              const tasaCambioInput = parseInt(prompt('Introduzca la taza de cambio del USD'));
              setTazaCambio(tasaCambioInput);
              setPromptShown(true);
            }
          }, 1000); // 1-second delay
         return () => clearTimeout(timer);
          
        
      }, [tasaCambio, promptShown]);
      
      */

  
  //{JSON.stringify(data, null, 2)}
  return(
  
          <div className="container">
      {<ListItems items={data} setItem={setItem} setEdit={setEdit}/>}
    </div>

   

    
  );
}