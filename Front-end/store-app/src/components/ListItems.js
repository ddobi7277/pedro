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
function ListItems({items}){
    const apiRef= useGridApiRef()
    const navigate = useNavigate();
    const [edit,setEdit] = useState(false);
    const [sell, setSell] = useState(false);
    const [deleteI,setDelete] = useState(false);
    const [token, ] = useState(localStorage.getItem('token'));
    const [tasaCambio, setTazaCambio] = useState(
        parseInt(localStorage.getItem('tasaCambio')) || 300
      );
    const [cant,setCant]= useState(0);
    const [gender, setGender] = useState('Masculino');
    const [category, setCategory] = useState([]);
    const [selectedItem, setSelectedItem] = useState({});
    const [orows,setRows]= useState([]);
    const [open, setOpen] = React.useState(false);

    const getRows= () => {
        const rows = items.map((item) => ({
        id: item.id, // Assuming `items` have an `id` property
        name: item.name,
        price:(item.price).toFixed(2),
        price_USD:(item.price_USD).toFixed(2) ,
        cost:item.cost,
        tax:item.tax,
        show_price:`${(item.price).toFixed(2)}MN - ${(item.price/tasaCambio).toFixed(2)}USD`,
        cant: item.cant,
        category: item.category,
        seller:item.seller,
        total_price:`${(item.price*item.cant).toFixed(2)} MN - ${(item.price_USD*item.cant).toFixed(2)} USD`,
        inversion:`${((((item.cost+item.tax)*tasaCambio)) * item.cant).toFixed(2)} MN - ${((item.cost+item.tax)*item.cant).toFixed(2)} USD`,
        revenue:`${((item.price*item.cant) - ((item.cost+item.tax)*tasaCambio)*item.cant).toFixed(2)} MN - ${(((item.price/tasaCambio)*item.cant) - ((item.cost+item.tax)*item.cant)).toFixed(2)} USD`
        
        // ... other calculations based on item properties
    }));
    return rows
    }
    
    const columns = [// Assuming `id` is used in your data
        { field: 'name', headerName: 'Nombre', width: 180,editable:true },
        { field: 'show_price', headerName: 'Precio', width: 180},
        { field: 'cant', headerName: 'Cantidad', width: 90 ,editable:true},
        { field: 'category', headerName: 'Categoria', width: 150 },
        { field: 'total_price', headerName: 'Precio Total', width: 240 },
        { field: 'inversion', headerName: 'Inversion Total', width: 240 },
        { field: 'revenue', headerName: 'Ganancias Total', width: 240 },
        // ... other columns based on item data
    ];
    const totalMN = items.length > 0 ?Math.round((items.reduce((acc, item) => acc + (item.price * item.cant),0))):0;
    const totalUSD = items.length > 0 ?Math.round((items.reduce((acc, item) => acc + Math.round((item.price * item.cant) / tasaCambio), 0))):0;
    const totalInversion= items.length > 0 ?Math.round((items.reduce((acc,item) => acc + (item.cost + item.tax)* tasaCambio * item.cant, 0))):0;
    const totalGanancias = items.length > 0 ?Math.round((items.reduce((acc, item) => acc + (item.price * item.cant) - (((item.cost*item.cant*tasaCambio) + (item.tax*item.cant*tasaCambio) )), 0))):0;
   
      const [snackbar, setSnackbar] = React.useState(null);
    
      const handleCloseSnackbar = () => setSnackbar(null);
    
    const get_categories_by_seller = async () => {
      try{
        const response = await fetch('https://www.cubaunify.uk/get_categories_by_seller', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
    });

    if (response.ok) {
        const cat = await response.json();
        setCategory(cat)
        console.log('In list Item:');
        console.log(cat)
      } else {
        const errorData= await response.json();
        console.log(errorData)
    }
    }catch (error){
        console.log(error)
    }}
    

    useEffect(() => {
        localStorage.setItem('totalMN', totalMN);
        localStorage.setItem('totalUSD', totalUSD);
        localStorage.setItem('totalGanancias', totalGanancias);
        localStorage.setItem('totalInversion', totalInversion);
        ( async () => {
          await get_categories_by_seller();
        } )();
        setRows(getRows())
    },[items])

    const getDateTimeString = () => {
        const now = new Date();
    
        // Format the date and time as a string
        const formattedDateTime = now.toLocaleString();
    
        return formattedDateTime;
      };
      const handleTasaCambioChange = (e) => {
        const newTasaCambio = e.target.value;
        setTazaCambio(newTasaCambio);
        setRows(getRows())
        localStorage.setItem('tasaCambio', newTasaCambio);
      };

      const handleEdit = (item) => {
         // Update state for Edit component preview (optional)
        const selectedRow = apiRef.current.getSelectedRows().values().next().value;
        navigate('/edit', { state: { body: selectedRow } });
    };
      
    const handleIncrement = () => {
        setCant(cant+1)
    }
    
    const handleRowSelectionModelChange = (newSelectionModel) => {
        if(newSelectionModel.length === 0){
            setEdit(false)
          
            return;
        }
        else{
            setSell(false)
            setEdit(true)
            setCant(0)
            console.log('length:',newSelectionModel.length)
            const selectedRow = apiRef.current.getSelectedRows().values().next().value;
            console.log(selectedRow)
            console.log('newSM',newSelectionModel)
        }
            

    };
    /*           
    data:{
                    'name':item.name,
                    'cant':cant[id],
                    'gender':gender,
                    'date':dateString
                  }
            })            
    */
    const handleSell= async(e)=> {
     // e.defaultPrevent()
     const selectedRow = apiRef.current.getSelectedRows().values().next().value;
     // console.log('E:',apiRef.current.);
      if(!selectedRow){
        setSell(true)
        return ;
      }
      if(selectedRow){
        console.log('Cantidad:',cant)
      
            const data = {
                'name':selectedRow.name,
                'cant':cant,
                'gender':gender,
                'date':getDateTimeString(),
                'revenue':(selectedRow.price - ((selectedRow.cost * tasaCambio) + (selectedRow.tax*tasaCambio) )),
                'revenue_USD':(selectedRow.price/tasaCambio) - (selectedRow.cost + selectedRow.tax) 
            }
    
            try{
            const response = await fetch('https://www.cubaunify.uk/create/sale',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                    },
                body: JSON.stringify(data)
            })
            const dataResponse = await response.json();
            if (response.ok){  
              setOpen(false)
              setSnackbar({ children: `Vendiste ${cant} ${selectedRow.name} ${cant*selectedRow.price} + para el bolsillo`, severity: 'success' })
              const timeoutId = setTimeout(() => {
                window.location.reload()
              }, 3000);
              return () => clearTimeout(timeoutId)
            }
    
            }catch (error){
            console.log(error)
        }
     
      } 
    }

    
    const handleDelete = async() => {
        const selectedRow = apiRef.current.getSelectedRows().values().next().value;
        if(selectedRow === undefined){
            setDelete(!deleteI?true:false)
        }
        if(selectedRow !== undefined){
            console.log(selectedRow)
            let sms= `Vas a eliminar ${selectedRow.name} estas segur@?`
            if(window.confirm(sms)){
                const response = await fetch(`https://www.cubaunify.uk/delete/items/${selectedRow.id}`,{
                 method: 'DELETE',
                 headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${token}`
                     },
                })
                const dataResonse = await response.json()
                if (response.ok){
                  setSnackbar({ children: `Eliminaste ${selectedRow.cant} ${selectedRow.name} !`, severity: 'error' })
                  const timeoutId = setTimeout(() => {
                    window.location.reload()
                  }, 6000);
                  return () => clearTimeout(timeoutId)
                }
             }  
        }
    }

    const handleC = () => {
          handleSell()
          console.log(orows)
      }
    

/*    const renderConfirmDialog = () => {
        if (!promiseArguments) {
          return null;
        }
    
        const { newRow, oldRow } = promiseArguments;
        const mutation = computeMutation(newRow, oldRow);
    
        return (
          <Dialog
            maxWidth="xs"
            
            open={!!promiseArguments}
          >
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogContent dividers>
              {`Pressing 'Yes' will change ${mutation}.`}
            </DialogContent>
            <DialogActions>
              <Button ref={noButtonRef} >
                No
              </Button>
              <Button >Yes</Button>
            </DialogActions>
          </Dialog>
        );
      };
    
*/

    
    return (
    <div>   
     <ButtonGroup>
      <Button color="primary" startIcon={<AddIcon />} onClick={() => {navigate('/create')}}>
        Crear Producto
      </Button>
      {<Button size="large" startIcon={<DeleteIcon/>} onClick={() => {handleDelete(selectedItem)}}>Borrar Producto</Button>}
            {edit&&
            <Button startIcon={<EditIcon />} onClick={() => {handleEdit()}}>Editar</Button>}
           
            {edit&&<Button startIcon={<AttachMoneyIcon />} onTouchStart={() => {setOpen(true);console.log(open)}} onClick={() => {setOpen(true);console.log(open)}}>Vender</Button>}
            {}
      <PositionedMenu />
      </ButtonGroup>
    {<Dialog disableEscapeKeyDown  open={open} onClose={(event,reason) => {reason !== 'backdropClick' ? setOpen(false):setOpen(true)}}
      PaperProps={{
        style: {
          position: 'fixed', 
          top: 0, 
          left: '30%', 
          transform: 'translateX(-50%)', 
          margin: 0, 
          zIndex: 1500 

        }
      }}
    
      >
    <DialogTitle>Elija Genero y cantidad de articulos a vender</DialogTitle>
    <DialogContent >
      <Box component='form' sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <FormControl sx={{ m: 1, minWidth: 120 }}>
      <InputLabel id="demo-simple-select-label" variant="outlined">Genero</InputLabel>
                      <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      value={gender}
                      label="Gender"
                      onChange={(e) => setGender(e.target.value)}
        >
                 <MenuItem value={'Masculino'}>Masculino</MenuItem>
                 <MenuItem value={'Femenino'}>Femenino</MenuItem>
        </Select>
      </FormControl>
      <Box
      sx={{
        color: 'action.active',
        display: 'flex',
        flexDirection: 'column',
        '& > *': {
          marginBottom: 2,
        },
        '& .MuiBadge-root': {
          marginRight: 2,
          marginLeft:2,
        },
      }}
    >
      <Box sx={{m:3}}>
      <Button
      variant="contained"
            aria-label="reduce"
            onClick={() => {
              setCant(Math.max(cant - 1, 0));
            }}
            startIcon={<RemoveIcon fontSize="small" />}
          />
      <Badge color="success" badgeContent={cant} showZero>
        <PointOfSaleIcon />
      </Badge>
          <Button
          variant="contained"
            aria-label="increase"
            onClick={() => {
              setCant(cant + 1);
            }}
            startIcon ={<AddIcon fontSize="small" />}
          />    
      </Box>
    </Box>
      </Box>
    </DialogContent>
    <DialogActions>
          <Button startIcon={<CloseOutlinedIcon />} onClick={(e,reason) => {setCant(0);reason !== 'backdropClick' ? setOpen(false):setOpen(true);console.log(e.details)}}>Cancel</Button>
          <Button startIcon={<SendIcon />} onClick={(event,reason) => {handleSell(reason)}}>Ok</Button>
        </DialogActions>
    </Dialog>  }
   
    
      
   
    
    <div>
    <Paper sx={{ height: '400px', width: columns.length*250 }}>
            
            <DataGrid 
                rows={orows} 
                columns={columns}
                apiRef={apiRef}
                initialState={{ pagination: { paginationModel } }}
                pageSizeOptions={[5, 10,15]}
                checkboxSelection
                disableMultipleRowSelection ={!deleteI?true:false}
                onRowSelectionModelChange={(params) => {handleRowSelectionModelChange(params)}}
                sx={{ border: 0 , height:'100%',marginBottom:'30px',marginTop:'10px'}}
                disableRowSelectionOnClick
                checkboxSelectionVisibleOnly
             />
      
             <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
      <ListItem>
        <ListItemAvatar>
          <Avatar  >
            <AttachMoneyIcon color= 'success' />
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary= "Dinero Total:" secondary= {`${totalMN.toFixed(2)} MN - ${totalUSD.toFixed(2)} USD`} />
      </ListItem>
      <ListItem>
        <ListItemAvatar>
          <Avatar sx={{background:'red'}}>
            <RemoveIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary="Inversion:" secondary={`${(totalInversion).toFixed(2)} MN - ${(totalInversion/tasaCambio).toFixed(2)} USD`} />
      </ListItem>
      <ListItem>
        <ListItemAvatar>
          <Avatar sx={{background:'Green'}}>
            <AttachMoneyIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary="Gananacias:" secondary={`${totalGanancias.toFixed(2)} MN - ${(totalGanancias/tasaCambio).toFixed(2)} USD`} />
      </ListItem>
      <ListItem>
        <ListItemAvatar>
          <Avatar sx={{background:'blue'}}>
            <CurrencyExchangeIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary= "Tasa de Cambio:" />
          <TextField value={tasaCambio} onChange={(e) => {handleTasaCambioChange(e)}}/>
      </ListItem>

    </List>
             
              {!!snackbar && (
              <Snackbar
                  open
                  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                  onClose={handleCloseSnackbar}
                  autoHideDuration={9000}
              >
              <Alert {...snackbar} onClose={handleCloseSnackbar} />
              </Snackbar>
               )}
            
    </Paper>
    </div>
    </div>
        
        );
      }
export default ListItems;
/*
 
    const filtredItems= (v) => {
        const value = v === ''?'name':v
        const searchValue= searcData === ''?'':searcData;
        console.log('v:',value)
        console.log('searchV:',searchValue)
       return items.filter(item => {
        const data = item[value].toLowerCase().includes(searchValue.toLowerCase());
        return data.length === 0 ? 'No hay registros para lo que esta buscando':data;
    })}
<div>
         {<div><h3>Tasa de Cambio del USD:</h3>
            <input onChange={(e) => {handleTasaCambioChange(e)}} value={tasaCambio} placeholder='Introduzca valor de USD en el mercado'/><p/>
            <input value={search==='name'?searcData:''} onFocus={() => {setSearch('name')}} onChange={(e) => {setSearchData(e.target.value)}} placeholder="busque su producto"/>
            </div>
            
            } 
    <Button variant="contained" onClick={()=>{navigate('/create')}}>Crear Producto</Button>
    <h2>Dashboard</h2>
    <div className="category-buttons">
        {category.map((cat) => (
          <button key={cat.id} onClick={() => {setSearchData(cat.name);setSearch('category')}}>
            {cat.name}
          </button>
        ))}
        <button onClick={() => {setSearchData('');setSearch('')}}>Ver Todo</button>
      </div>
    

    {(items.length === 0 | filtredItems(search).length === 0) ? <div>No tiene ningun producto registrado..... registre su producto en Crear Producto</div> :<div>
            <h1>List</h1>
            
                <table>
                <thead>
                    <tr>
                        <th>Nombre del Producto  </th>
                        <th>Precios de venta:</th>
                        <th> </th>
                        <th>Cantidad  </th>
                        <th>Categoria  </th>
                        <th>Precio Total: </th>
                        <th>Inversion Total: </th>
                        <th>Posibles Ganancias: </th>
                        <th> </th>
                        <th> </th>
                        <th> </th>
                    </tr>
                </thead>
                <tbody>
                {filtredItems(search).map((item, id) => (
                <tr key={id}>
                    <td>{item.name}</td>
                    <td>  {item.price} MN - {item.price_USD} USD</td>
                    <td></td>
                    <td>  {item.cant}</td>
                    <td>  {item.category}</td>
                    <td>  {Math.round((item.price * item.cant)*100)/100} MN - {Math.round(((item.price * item.cant)/tasaCambio)*100)/100} USD</td>
                    <td>  {Math.round((((item.cost*tasaCambio) + (item.tax*tasaCambio)) * item.cant)*100)/100} MN - {Math.round(((item.cost+item.tax)*item.cant)*100)/100} USD</td>
                    <td>  {Math.round(((item.price * item.cant) - (((item.cost*tasaCambio) + (item.tax*tasaCambio)) * item.cant))*100)/100} MN - {Math.round((((item.price * item.cant) - (item.cost*item.cant))/tasaCambio)*100)/100} USD</td>
        
                    <td><button key={id} onClick={() => {handleDelete(item)}}>Eliminar</button></td>
                    <td><button key={id} onClick={() => {handleEdit(item)}}>Editar</button></td>
                    <td><button key={id} onClick={() => {handleSelect(id);handleSell(item,id)}}>Vender</button></td>
                    <td>
                    {selectedIndex===id&&<button onClick={() => {handleIncrement(id)}}>+</button>}
                    </td>
                    <td>
                    {selectedIndex===id&&<select onChange={(e)=> {setGender(e.target.value)}}>{['Masculino','Femenino'].map((option)=> (
                        <option key={option} value={option}>{option}</option>
                    ))}</select>}
                    </td>
                    <td>
                    {selectedIndex===id&&<p>{cant[id]}</p>}
                    </td>
                </tr>
                
            ))}
                </tbody>
            </table>
            <h2>Totales:</h2>
            <p>Total MN: {totalMN}</p>
            <p>Total USD: {totalUSD}</p>
            <p>Inversion Total: {totalInversion} MN - {Math.round((totalInversion/tasaCambio)*100)/100} USD</p>
            <p>Ganancias: {totalGanancias} MN - {Math.round((totalGanancias/tasaCambio)*100)/100} USD</p>


   
        </div>
    }
    <Button variant="contained" onClick={(e)=> {navigate("/");localStorage.removeItem('token')} }>LogOut</Button>
    </div>
*/