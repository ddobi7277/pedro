import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LogoutIcon from '@mui/icons-material/Logout';
import { Box } from '@mui/material';
import PaidIcon from '@mui/icons-material/Paid';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useNavigate } from 'react-router-dom';


export default function PositionedMenu(){
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = React.useState(null);
      const openO = Boolean(anchorEl);
      const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const logOut = () => {
    localStorage.removeItem('token');
    navigate('/login');
  }
  return (
    <Box sx={{ display: 'flex' }}>

        <Button
        variant="outlined"
        id="demo-positioned-button"
        aria-controls={openO ? 'demo-positioned-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={openO ? 'true' : undefined}
        onClick={(e)=>{handleClick(e)}}
      >
        Menu
      </Button>
      <Menu
        id="demo-positioned-menu"
        aria-labelledby="demo-positioned-button"
        anchorEl={anchorEl}
        open={openO}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={() => {handleClose();navigate('/dashboard')}}><InventoryIcon sx={{marginRight:'4px'}}/> Inventario</MenuItem>
        <MenuItem onClick={() => {handleClose();navigate("/sales")}}><PaidIcon sx={{marginRight:'4px'}}/> Ventas</MenuItem>
        <MenuItem onClick={() => {handleClose();logOut()}}><LogoutIcon sx={{marginRight:'4px'}}/> Cerrar Session</MenuItem>
      </Menu>
    </Box>
  )
}
