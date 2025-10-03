import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import CssBaseline from '@mui/material/CssBaseline';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import AddIcon from '@mui/icons-material/Add';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';


import AppTheme from './LoginComponents/AppTheme';
import ColorModeSelect from './LoginComponents/ColorModeSelect';
import { getApiUrl } from '../config/apiConfig';


const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const CreateContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));
function Create() {
  const navigate = useNavigate();
  const [errorName, setErrorName] = useState(false);
  const [errorCost, setErrorCost] = useState(false);
  const [errorCostM, setErrorCostM] = useState('');
  const [errorPrice, setErrorPrice] = useState(false);
  const [errorPriceM, setErrorPriceM] = useState('');
  const [errorCant, setErrorCant] = useState(false);
  const [errorCantM, setErrorCantM] = useState('');
  const [errorCat, setErrorCat] = useState(false);
  const [errorCatM, setErrorCatM] = useState('');
  const [country, setCountry] = useState('Cuba');
  const [show, setShow] = useState(false)
  const [errorC, setErrorC] = useState('')
  const [newcat, setNewCat] = useState(false);
  const [editcat, setEditCat] = useState('');
  const [catname, setCatName] = useState("");
  const [currency, setCurrency] = useState('USD')
  const [token,] = useState(localStorage.getItem('token'))
  const [category, setCategory] = useState("");
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [cant, setCant] = useState('');
  const [detalles, setDetalles] = useState(''); // New field for details
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [tasaCambio,] = useState(parseInt(localStorage.getItem('tasaCambio')) || 300)
  const [categoryList, setCategoryList] = useState([].sort());
  const theme = useTheme();
  //    const storedCategories = localStorage.getItem('categoryList');
  //    return storedCategories ? JSON.parse(storedCategories) : [];
  //  });
  //(item.cost*0.16)

  const verifiToken = async () => {
    try {
      const response = await fetch(getApiUrl(`verify-token/${token}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        navigate('/login')
      }
    } catch (error) {
      console.log(error)
      navigate('/login')
    }
  }
  const get_categories_by_seller = async () => {
    try {
      const response = await fetch(getApiUrl('get_categories_by_seller'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
      });

      if (response.ok) {
        const cat = await response.json();
        setCategoryList(cat)
        console.log('In list Item:');
        console.log(cat)
      } else {
        const errorData = await response.json();
        console.log(errorData)
      }
    } catch (error) {
      console.log(error)
      navigate('/login')
    }
  }


  useEffect(() => {
    (async () => {
      await verifiToken();
      await get_categories_by_seller();
    })();
    //console.log(catname)

  }, []);
  const validateInputs = () => {

    let isValid = true;
    if (name.length === 0) {
      setErrorC('Debe llenar todos los espacios con algo')
      setErrorName(true)
      isValid = false;
    } else {
      setErrorName(false);
      setErrorC('');
    }
    if (cost.length === 0) {
      setErrorCostM('Debe llenar todos los espacios con algo')
      setErrorCost(true)
      isValid = false;
    } else {
      setErrorCost(false);
      setErrorCostM('');
    }
    if (price.length === 0) {
      setErrorPriceM('Debe llenar todos los espacios con algo')
      setErrorPrice(true)
      isValid = false;
    } else {
      setErrorPrice(false);
      setErrorPriceM('');
    }
    if (category.length === 0) {
      setErrorCatM('Debe llenar todos los espacios con algo')
      setErrorCat(true)
      isValid = false;
    } else {
      setErrorCat(false);
      setErrorCatM('')
    }
    if (cant.length === 0) {
      setErrorCantM('Debe llenar todos los espacios con algo')
      setErrorCant(true)
      isValid = false;
    } else {
      setErrorCant(false);
      setErrorCantM('');
    }

    return isValid;
  };

  // Image handling functions
  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      const newImages = [...selectedImages, ...files];
      setSelectedImages(newImages);

      // Create previews for new images
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreviews(prev => [...prev, {
            file: file,
            preview: reader.result,
            id: Date.now() + Math.random() // Unique ID for each image
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleImageRemove = (imageId) => {
    setImagePreviews(prev => prev.filter(img => img.id !== imageId));
    // Also remove from selectedImages by finding the corresponding file
    const imageToRemove = imagePreviews.find(img => img.id === imageId);
    if (imageToRemove) {
      setSelectedImages(prev => prev.filter(file => file !== imageToRemove.file));
    }
  };

  const clearForm = () => {
    setName('');
    setCost('');
    setPrice('');
    setCant('');
    setDetalles('');
    setSelectedImages([]);
    setImagePreviews([]);
    setFallbackMode(false);
    setCatName('');
    setCategory('');
  };

  const handleSubmit = async () => {
    console.log('Country', country)
    if (validateInputs()) {
      try {
        let response;

        if (selectedImages.length > 0) {
          // Try the new endpoint first, fallback to original if 404
          const formData = new FormData();
          formData.append('name', name);
          formData.append('cost', currency === 'MN' ? (cost / tasaCambio).toFixed(2) : cost); // Costo según moneda seleccionada → USD
          formData.append('price', price); // Price se ingresa en MN
          formData.append('tax', country === 'Cuba' ? 0 : ((currency === 'MN' ? (cost / tasaCambio) : cost) * 0.16).toFixed(2)); // Tax sobre costo en USD
          formData.append('price_USD', (price / tasaCambio).toFixed(2)); // Price MN → USD
          formData.append('cant', cant);
          formData.append('category', catname);
          formData.append('detalles', detalles);
          formData.append('seller', 'seller');

          // Append multiple images
          selectedImages.forEach((image, index) => {
            formData.append(`images`, image);
          });

          try {
            // Try new optimized endpoint first
            response = await fetch(getApiUrl('creat/item-with-images'), {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            });

            // If 404, fallback to original endpoint with JSON (no images)
            if (response.status === 404) {
              console.log('Fallback: Using original endpoint (images not supported)');
              setFallbackMode(true);

              // Create JSON object for original endpoint
              const item = {
                "name": name,
                "cost": currency === 'MN' ? (cost / tasaCambio).toFixed(2) : cost, // Costo según moneda seleccionada → USD
                "price": price, // Price se ingresa en MN
                "tax": country === 'Cuba' ? 0 : ((currency === 'MN' ? (cost / tasaCambio) : cost) * 0.16).toFixed(2), // Tax sobre costo en USD
                "price_USD": (price / tasaCambio).toFixed(2), // Price MN → USD
                "cant": cant,
                "category": catname,
                "detalles": detalles,
                "seller": "seller"
                // Note: No images field - original endpoint doesn't support them
              };

              response = await fetch(getApiUrl('creat/item'), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(item)
              });
            }
          } catch (error) {
            console.error('Error with image upload:', error);
            throw error;
          }
        } else {
          // Use JSON when no images
          const item = {
            "name": name,
            "cost": currency === 'MN' ? (cost / tasaCambio).toFixed(2) : cost, // Costo según moneda seleccionada → USD
            "price": price, // Price se ingresa en MN
            "tax": country === 'Cuba' ? 0 : ((currency === 'MN' ? (cost / tasaCambio) : cost) * 0.16).toFixed(2), // Tax sobre costo en USD
            "price_USD": (price / tasaCambio).toFixed(2), // Price MN → USD
            "cant": cant,
            "category": catname,
            "detalles": detalles,
            "seller": "seller"
          }

          response = await fetch(getApiUrl('creat/item'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(item)
          });
        }
        const data = await response.json()
        if (response.ok) {
          console.log(data)
          clearForm()
          navigate('/dashboard')
        }
        if (response.status === 401) {
          setErrorC('No esta autorizado o su tiempo de session expiro')
        }


        const timer = setTimeout(() => {
          if (!response.ok) {
            window.location.reload()
          }
        }, 9000); // 1-second delay
        return () => clearTimeout(timer);

      } catch (error) {
        console.log('Error:', error);
        setErrorC('No esta autorizado')
        const timer = setTimeout(() => {
          if (error) {
            window.location.reload()
          }
        }, 9000); // 1-second delay
        return () => clearTimeout(timer);

      }
    }

  }
  const handleNewCat = async () => {
    console.log('newCat:', newcat)
    console.log('catName:', catname)
    console.log('category:', category)
    console.log(editcat)

    if (editcat.length > 0) {

      try {
        const response = await fetch(getApiUrl('create/category'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: editcat })
        })
        const data = await response.json()
        if (response.ok) {
          console.log(data)
          setErrorC(false)
          window.location.reload()
        }
        if (response.status === 400) {
          setErrorC('Este producto ya existe')
        }
        if (response.status === 401) {
          setErrorC('No esta autorizado o su tiempo de session expiro')
        }


        const timer = setTimeout(() => {
          if (!response.ok) {
            window.location.reload()
          }
        }, 9000); // 1-second delay
        return () => clearTimeout(timer);

      } catch (error) {
        console.log('Error', error)
        navigate('/login')
      }
    }
    console.log(newcat)
  };
  const handleEditCat = async () => {
    console.log('newCat:', newcat)
    console.log('catName:', catname)
    console.log('category:', category)
    console.log(editcat)

    console.log(category)
    if (editcat.length > 0) {
      try {
        const response = await fetch(getApiUrl(`edit/category/${category}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: editcat })
        }).catch(error => {
          console.log('Error in handleEditCat', error)
        })
        const data = await response.json()
        if (response.ok) {
          console.log(data)
          setErrorC(false)
          window.location.reload()
        }

      } catch (error) {
        console.log('Error', error)
      }
    }
    //101181ea-6c37-4b36-a292-935338ab488b
    //101181ea-6c37-4b36-a292-935338ab488b
  };
  const handleDeleteCat = async () => {
    console.log(category)
    if (category.length > 0) {
      try {
        const response = await fetch(getApiUrl(`delete/category/${category}`), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: catname })
        }).catch(error => {
          console.log('Error in handleEditCat', error)
        })
        const data = await response.json()
        if (response.ok) {
          console.log(data)
          setErrorC(false)
          window.location.reload()
        }

      } catch (error) {
        console.log('Error', error)
      }
    }
  }


  return (
    <AppTheme >
      <CssBaseline enableColorScheme />
      <CreateContainer direction="column" justifyContent="space-between">
        <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
        <Card variant="outlined">

          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Registra tu Producto
          </Typography>
          <FormControl>
            <FormLabel>Nombre del Producto:</FormLabel>
            <TextField
              error={errorName}
              helperText={errorC}
              id="username"
              type="name"
              name="name"
              placeholder="Nombre del Producto"
              value={name}
              autoFocus
              required
              fullWidth
              variant="outlined"
              color={errorName ? 'error' : 'primary'}
              sx={{ ariaLabel: 'name' }}
              onChange={(e) => { setName(e.target.value) }}
              onFocus={() => { setShow(false) }}
            />
          </FormControl>

          <FormControl fullWidth component="fieldset">
            <FormLabel component="legend">Costo del Producto:</FormLabel>
            <Box display="flex"  >
              <TextField
                error={errorCost}
                helperText={errorCostM}
                id="costo"
                type="number"
                name="cost"
                placeholder="Lo que te costo el producto"
                value={cost}
                autoFocus
                required
                variant="outlined"
                color={errorCost ? 'error' : 'primary'}
                sx={{ ariaLabel: 'costo', marginRight: '10px', m: 1 }}
                onChange={(e) => { setCost(e.target.value) }}
                onFocus={() => { setShow(false) }}
              />
              <Box sx={{ m: 1 }}><Select
                color={errorCost ? 'error' : 'primary'}
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={currency}
                label="Moneda" // Change label to "Moneda"
                onChange={(e) => setCurrency(e.target.value)}
                sx={{ width: '80%' }} // Set width to fill the remaining space
              >
                <MenuItem value={'USD'}>USD</MenuItem>
                <MenuItem value={'MN'}>MN</MenuItem>
              </Select></Box>
            </Box>

          </FormControl>

          <Box display="flex" > {/* Flexbox for layout */}
            <FormControl fullWidth sx={{ marginRight: theme.spacing(5) }}> {/* Margin for spacing */}
              <FormLabel component="legend">Precio:</FormLabel>
              <TextField
                error={errorPrice}
                helperText={errorPriceM}
                id="price"
                type="number"
                name="price"
                placeholder="Precio al que lo vas a vender"
                value={price}
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={errorPrice ? 'error' : 'primary'}
                sx={{ ariaLabel: 'price', width: '120%', marginRight: '10px' }}
                onChange={(e) => { setPrice(e.target.value) }}
                onFocus={() => { setShow(false) }}

              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel component="legend">Cantidad:</FormLabel>
              <TextField
                error={errorCant}
                helperText={errorCantM}
                id="cant"
                type="number"
                name="cant"
                placeholder="Cuantos tienes"
                value={cant}
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={errorCant ? 'error' : 'primary'}
                sx={{ ariaLabel: 'cant', width: '80%' }}
                onChange={(e) => { setCant(e.target.value) }}
                onFocus={() => { setShow(false) }}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel component="legend">Detalles:</FormLabel>
              <TextField
                id="detalles"
                type="text"
                name="detalles"
                placeholder="Descripción detallada del producto"
                value={detalles}
                multiline
                rows={3}
                fullWidth
                variant="outlined"
                color="primary"
                sx={{ ariaLabel: 'detalles', width: '80%' }}
                onChange={(e) => { setDetalles(e.target.value) }}
                onFocus={() => { setShow(false) }}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel component="legend">Imágenes del Producto:</FormLabel>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  type="file"
                  multiple
                  onChange={handleImageSelect}
                />
                <label htmlFor="image-upload">
                  <IconButton color="primary" aria-label="upload picture" component="span">
                    <PhotoCameraIcon />
                  </IconButton>
                  <span style={{ marginLeft: 8 }}>Agregar imágenes ({imagePreviews.length}/5)</span>
                </label>
                {fallbackMode && (
                  <Typography variant="body2" color="warning.main" sx={{ fontSize: '0.875rem', fontStyle: 'italic' }}>
                    ⚠️ Servidor no actualizado: Las imágenes no se guardarán (solo texto)
                  </Typography>
                )}
                {imagePreviews.length > 0 && (
                  <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    maxHeight: 200,
                    overflow: 'auto'
                  }}>
                    {imagePreviews.map((img) => (
                      <Box
                        key={img.id}
                        sx={{
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}
                      >
                        <Avatar
                          src={img.preview}
                          sx={{ width: 80, height: 80 }}
                          variant="rounded"
                        />
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleImageRemove(img.id)}
                          sx={{
                            position: 'absolute',
                            top: -5,
                            right: -5,
                            backgroundColor: 'white',
                            '&:hover': { backgroundColor: '#ffebee' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </FormControl>
          </Box>
          <FormControl>
            <FormLabel component="legend">Categoria:</FormLabel>
            <Box sx={{ m: 1 }}><Select
              color={errorCat ? 'error' : 'primary'}
              error={errorCat}
              labelId="demo2-simple-select-label"
              id="demo2-simple-select"
              value={catname}
              label="Categoria" // Change label to "Moneda"
              onFocus={() => { setShow(true); console.log('show:', show + '- newCat:', newcat) }}
              onChange={(e) => {
                const selectedOption = categoryList.find(
                  (option) => option.name === e.target.value
                );
                setCategory(selectedOption.id);
                setCatName(e.target.value);
              }}
              sx={{ width: show ? '40%' : '100%' }} // Set width to fill the remaining space
              placeholder="Seleccione o Cree una Categoria"
            >
              {categoryList.map((option) => (
                <MenuItem key={option.id} value={option.name} >{option.name}</MenuItem>
              ))}
            </Select>
              {errorCat && <FormHelperText error>{errorCatM}</FormHelperText>}
              {show && <Button onClick={(e) => { console.log(e.target); newcat ? handleNewCat() : setNewCat(true) }} variant="outlined" sx={{ width: '10%', margin: '6px' }} startIcon={<AddIcon />} />}
              {show && <Button onClick={() => { newcat ? handleEditCat() : setNewCat(true) }} variant="outlined" sx={{ width: '10%', margin: '3px' }} startIcon={<EditIcon />} />}
              {show && <Button onClick={() => { handleDeleteCat() }} variant="outlined" sx={{ width: '10%', margin: '3px' }} startIcon={<DeleteIcon />} />}
            </Box>
            {(newcat && show) && <FormControl fullWidth>
              <TextField
                error={errorName}
                helperText={errorC}
                id="newCat"
                type="text"
                name="newCat"
                placeholder="Introduzca su nueva categoria"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={errorName ? 'error' : 'primary'}
                sx={{ ariaLabel: 'cant', width: '80%', m: 1 }}
                onChange={(e) => { setEditCat(e.target.value) }}


              />
            </FormControl>}

          </FormControl>
          <FormControl>
            <FormLabel component="legend">Pais donde lo compro:</FormLabel>
            <Box ><Select

              labelId="demo2-simple-select-label"
              id="demo2-simple-select"
              value={country}
              label="Categoria" // Change label to "Moneda"
              onFocus={() => { setShow(false) }}
              onChange={(e) => {
                setCountry(e.target.value)
              }}
              sx={{ width: '40%' }} // Set width to fill the remaining space
              placeholder="Seleccione o Cree una Categoria"
            >
              {['Cuba', 'Otro'].map((option) => (
                <MenuItem key={option} value={option} >{option}</MenuItem>))}

            </Select>
            </Box>
          </FormControl>
          <Box>
            <Button
              variant="outlined"
              sx={{ width: '40%', color: 'white', background: 'green' }}
              startIcon={<SendRoundedIcon />}
              onClick={() => { handleSubmit() }}
            >Enviar</Button>
            <Button
              variant="outlined"
              sx={{ width: '40%', color: 'white', background: 'red', marginLeft: '18px' }}
              onClick={() => { navigate('/dashboard') }}
              startIcon={<ArrowBackIcon />}
            >Atras</Button>
          </Box>

        </Card>
      </CreateContainer>
    </AppTheme>
  )
}
export default Create;
/**
 * 
 * <div>
            <label>Nombre: <input onFocus={() => {setShow(false)}} placeholder="Nombre del Producto" value={name} onChange={(e)=>{setName(e.target.value)}} /></label><p/>
            <label>Costo: <input onFocus={() => {setShow(false)}} type="number" placeholder="Costo del Producto" value={cost} onChange={(e) => {setCost(e.target.value)}}/><select onChange={(e)=> {setCurrency(e.target.value)}}>{['USD','MN'].map((option)=> (
                        <option key={option} value={option}>{option}</option>
                    ))}</select></label><p/>
            <label>Precio: <input onFocus={() => {setShow(false)}} type="number"  placeholder="Precio a Vender" value={price} onChange={(e) => {setPrice(e.target.value)}}/></label><p/>
            <label>Cantidad: <input onFocus={() => {setShow(false)}} type="number" placeholder="Cantidad que hay" value={cant} onChange={(e) => {setCant(e.target.value)}}/></label><p/>
            <label>Categoria: <select  onFocus={() => {setShow(true)}} onChange={(e)=> {setCategory(e.target.value);setCatName(e.target.selectedOptions[0].text);}}>{categoryList.map((option)=> (
                <option key={option.id} value={option.id}>{option.name}</option>
            ))}</select> 
            {
            show&&<button onBlur={() => {setEditCat(false);setNewCat(false)}} onClick={() => {handleNewCat()}}>+</button>}{show&&<button onBlur={() => {setEditCat(false);setNewCat(false)}} onClick={() => {handleEditCat()}}>Editar Categoria</button>}{show&&<button onClick={handleDeleteCat}>Eliminar</button>}
            {errorC.length > 0 && <p style={{color:'red'}}>{errorC}</p>}
            {editcat&&<div><input value={catname} placeholder="Arregle el nombre de su categoria" onBlur={() => {setEditCat(false);setNewCat(false)}} onChange={(e) => {setCatName(e.target.value)}} /></div>}
            {newcat&&<div><input value={catname} placeholder="Introduzca su nueva categoria" onBlur={() => {setEditCat(false);setNewCat(false)}} onChange={(e) => {setCatName(e.target.value)}}/><p/></div>}
            </label><p/>
            <label>Pais donde lo compro: <select onFocus={() => {setShow(false)}} onBlur={() => {console.log(country)}} onChange={(e)=> {setCountry(e.target.value)}}>{['Cuba','Otro'].map((option)=> (
                        <option key={option} value={option}>{option}</option>
                    ))}</select></label><p/> 
            
            <button onClick={() => {handleSubmit()}}>Submit</button>
            <button onClick={() => {navigate('/dashboard')}}>Back</button>
        </div>
 */