import React, {useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import Button from '@mui/material/Button'
import { DataGrid, useGridApiRef } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import SendIcon from '@mui/icons-material/Send';
import DialogActions from '@mui/material/DialogActions';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { ButtonGroup, TextField } from "@mui/material";
import RemoveIcon from '@mui/icons-material/Remove';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import Badge from '@mui/material/Badge';
import PositionedMenu from "./Menu";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
const paginationModel = { page: 0, pageSize: 10 };
function Sales() {
    const [data, setData] = useState([]);
    const navigate = useNavigate();
    const [tasaCambio, setTazaCambio] = useState(
        parseInt(localStorage.getItem('tasaCambio')) || 300
      );
    const [rows, setRows] = useState([]);
    const apiRef= useGridApiRef()
    const [deleteI,setDelete] = useState(false);

    const verifiToken = async () => {
        try{
            const response = await fetch(`https://www.cubaunify.uk/verify-token/${localStorage.getItem('token')}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
        });
    
        if (response.ok) {
            //setIsLoaded(true);
            const seller_iitem= await fetch('https://www.cubaunify.uk/get_seller_sales',{
              method: 'GET',
              headers:{
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
              }
            })
            const seller_sales = await seller_iitem.json()
            setData(seller_sales)
            //setIsLoaded(true)
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
  
  const oRows = data.map((sale) => ({
        id: sale.id, // Assuming `items` have an `id` property
        name: sale.name,
        price:(sale.price).toFixed(2),
        price_USD:(sale.price_USD).toFixed(2) ,
        cost:sale.cost,
        show_price:`${(sale.price).toFixed(2)}MN - ${(sale.price/tasaCambio).toFixed(2)}USD`,
        show_invertion:`${(sale.cost*tasaCambio).toFixed(2)} MN - ${(sale.cost).toFixed(2)} USD`,
        show_revenue:`${sale.revenue.toFixed(2)} MN - ${sale.revenue_USD.toFixed(2)} USD`,
        cant: sale.cant,
        category: sale.category,
        seller:sale.seller,
        gender:sale.gender,
        date:sale.date,
        revenue:sale.revenue,
        revenue_USD:sale.revenue_USD        
        // ... other calculations based on item properties
    }));


const columns = [// Assuming `id` is used in your data
        { field: 'name', headerName: 'Nombre', width: 180,editable:true },
        { field: 'cant', headerName: 'Cantidad', width: 90 ,editable:true},
        { field: 'category', headerName: 'Categoria', width: 150 },
        { field: 'date' , headerName:'Fecha', width:240 },
        { field: 'gender', headerName: 'Vendido a:', width: 100 },
        { field: 'show_price', headerName: 'Precio de la Venta', width: 240 },
        { field: 'show_invertion', headerName: 'Inversion Total', width: 240 },
        { field: 'show_revenue', headerName: 'Ganancias Total', width: 240 },
        // ... other columns based on item data
    ];
    
    useEffect(() => {
          (async () => {
            await verifiToken()
          })();
            console.log('data:',data)
    }, []);

    const totalGananciasMN = data.length > 0 ?((data.reduce((acc, sales) => acc + (sales.revenue) , 0))):0;
    const totalGananciasUSD = data.length > 0 ?((data.reduce((acc, sales) => acc + (sales.revenue_USD) , 0))):0;
    
    return(
        <div>
            <div>

            <PositionedMenu />
            <Paper sx={{ height: '400px', width: columns.length*250 }}>
        <DataGrid 
            rows={oRows} 
            columns={columns}
            apiRef={apiRef}
            initialState={{ pagination: { paginationModel } }}
            pageSizeOptions={[5, 10,15]}
            sx={{ border: 0 , height:'100%',marginBottom:'30px',marginTop:'10px'}}
            disableRowSelectionOnClick
            
            />

     {totalGananciasMN > 0 ? (<List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
        <ListItem alignItems="flex-start">
        <ListItemAvatar>
          <Avatar  >
            <AttachMoneyIcon color= 'success' />
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary= "Ganancias en las ventas" secondary= {`${totalGananciasMN.toFixed(2)} MN - ${totalGananciasUSD.toFixed(2)} USD`} />
      </ListItem>
      </List>):( 
        <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
        <ListItem alignItems="flex-start">
        <ListItemAvatar>
        <Avatar sx={{background:'red'}}>
            <RemoveIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary= "Perdidas en las ventas:" secondary= {`${totalGananciasMN.toFixed(2)} MN - ${totalGananciasUSD.toFixed(2)} USD`} />
      </ListItem>
      </List>)}
        
        </Paper>
            </div>
        </div>
    )
}
export default Sales;
