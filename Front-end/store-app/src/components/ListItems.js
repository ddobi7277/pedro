import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from '@mui/material/Button'
import {
  DataGrid,
  useGridApiRef,
  GridRowModes,
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridToolbar
} from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import Snackbar from '@mui/material/Snackbar';
import { getApiUrl, apiConfig } from '../config/apiConfig';
import Alert from '@mui/material/Alert';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { ButtonGroup, TextField, Tooltip } from "@mui/material";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

// Helper function para construir URLs de imágenes usando apiConfig
const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${apiConfig.currentBaseUrl}${imagePath}`;
};
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import FormControl from '@mui/material/FormControl';
import SendIcon from '@mui/icons-material/Send';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
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
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import BadgeIcon from '@mui/icons-material/Badge';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { styled, createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { grey, blueGrey } from '@mui/material/colors';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

// Tema personalizado para la tabla con mejoras responsive
const inventoryTheme = createTheme({
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: '12px',
          overflow: 'hidden',
          // Responsive font sizes
          fontSize: {
            xs: '0.75rem',
            sm: '0.8rem',
            md: '0.875rem'
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: blueGrey[50],
            borderRadius: '0',
            borderBottom: `1px solid ${grey[200]}`,
            color: 'text.secondary',
          },
          '& .MuiDataGrid-columnHeader': {
            padding: {
              xs: '0 8px',
              sm: '0 12px',
              md: '0 16px'
            },
            borderRight: 'none',
          },
          '& .MuiDataGrid-cell': {
            padding: {
              xs: '4px 8px',
              sm: '6px 12px',
              md: '8px 16px'
            },
            borderBottom: `1px solid ${grey[100]}`,
            display: 'flex',
            alignItems: 'center',
            fontSize: 'inherit',
            '&:focus, &:focus-within': {
              outline: 'none',
            },
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
            fontSize: 'inherit',
          },
          '& .MuiDataGrid-columnSeparator': {
            display: 'none',
          },
          '& .MuiDataGrid-row': {
            '&:hover': {
              backgroundColor: grey[50],
            },
          },
        },
        toolbar: {
          backgroundColor: grey[50],
          borderBottom: `1px solid ${grey[200]}`,
          padding: '8px 16px',
        },
        footerContainer: {
          backgroundColor: grey[50],
          borderTop: `1px solid ${grey[200]}`,
        },
      },
    },
  },
});

// Componente estilizado para chips de estado
const StatusChip = styled(Chip)(({ theme }) => ({
  borderRadius: '6px',
  height: '28px',
  fontWeight: 500,
  fontSize: '0.75rem',
  '& .MuiChip-label': {
    padding: '0 8px',
  },
  '&.in_stock': {
    color: theme.palette.success.dark,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  '&.low_stock': {
    color: theme.palette.warning.dark,
    backgroundColor: 'rgba(237, 108, 2, 0.1)',
  },
  '&.out_of_stock': {
    color: theme.palette.error.dark,
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
  },
}));

const paginationModel = { page: 0, pageSize: 10 };
function ListItems({ items, username }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // <= 600px
  const isTablet = useMediaQuery(theme.breakpoints.down('md')); // <= 900px
  const isSmallLaptop = useMediaQuery(theme.breakpoints.down('lg')); // <= 1200px
  const isLargeLaptop = useMediaQuery(theme.breakpoints.up('xl')); // >= 1536px

  const apiRef = useGridApiRef()
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const [sell, setSell] = useState(false);
  const [deleteI, setDelete] = useState(false);
  const [token,] = useState(localStorage.getItem('token'));
  const [tasaCambio, setTazaCambio] = useState(
    parseInt(localStorage.getItem('tasaCambio')) || 450  // Cambiado de 360 a 450
  );
  const [cant, setCant] = useState(0);
  const [gender, setGender] = useState('Masculino');
  const [category, setCategory] = useState([]);
  const [selectedItem, setSelectedItem] = useState({});
  const [orows, setRows] = useState([]);
  const [open, setOpen] = React.useState(false);

  // Estado para el acordeón de columnas en móvil
  const [expandedColumn, setExpandedColumn] = useState(null);

  // Función para manejar el clic en headers de columnas (solo móvil)
  const handleColumnHeaderClick = (fieldName) => {
    if (isMobile) {
      setExpandedColumn(prev => prev === fieldName ? null : fieldName);
    }
  };

  // Estados para edición en línea
  const [rowModesModel, setRowModesModel] = useState({});
  const [snackbar, setSnackbar] = React.useState(null);

  // Estados para rastrear valores originales
  const [originalValues, setOriginalValues] = useState({});

  // Estado para rastrear qué filas están siendo editadas en modo cell
  const [cellEditingRows, setCellEditingRows] = useState(new Set());

  // Estado para capturar cambios de edición temporal
  const [editingChanges, setEditingChanges] = useState({});

  // Estados para diálogos de confirmación
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [itemToSave, setItemToSave] = useState(null);

  // Estado para filas expandidas
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Estados para el modal de imágenes
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);

  // Función para abrir el modal de imágenes
  const openImageModal = (images, startIndex = 0, item = null) => {
    if (images && images.length > 0) {
      setSelectedImages(images);
      setCurrentImageIndex(startIndex);
      setSelectedItem(item);
      setImageModalOpen(true);
    }
  };

  // Función para navegar entre imágenes
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + selectedImages.length) % selectedImages.length);
  };

  // Función para agregar nuevas imágenes
  const handleAddImages = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0 || !selectedItem) return;

    setIsUploadingImages(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await apiConfig.fetchWithFallback(`items/${selectedItem.id}/add-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        // Mostrar mensaje de éxito y recargar página
        alert(`${result.new_images.length} imágenes agregadas exitosamente`);
        window.location.reload();
      } else {
        throw new Error('Error al subir imágenes');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error al subir las imágenes');
    } finally {
      setIsUploadingImages(false);
      // Limpiar el input
      event.target.value = '';
    }
  };

  // Función para eliminar una imagen
  const handleRemoveImage = async () => {
    if (!selectedItem || selectedImages.length === 0) return;

    const currentImageUrl = selectedImages[currentImageIndex];
    if (!currentImageUrl) return;

    // Extraer solo el nombre del archivo de la URL
    // De "/uploads/pedro/pedro_CadenadePlata_660acfb1.png" obtener "pedro_CadenadePlata_660acfb1.png"
    const imageName = currentImageUrl.split('/').pop();

    if (!window.confirm(`¿Estás seguro de que quieres eliminar la imagen: ${imageName}?`)) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image_name', imageName);

      const response = await apiConfig.fetchWithFallback(`items/${selectedItem.id}/delete-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        // Actualizar las imágenes en el modal
        const updatedImages = selectedImages.filter(img => img !== currentImageUrl);
        setSelectedImages(updatedImages);

        // Ajustar el índice actual si es necesario
        if (currentImageIndex >= updatedImages.length && updatedImages.length > 0) {
          setCurrentImageIndex(updatedImages.length - 1);
        } else if (updatedImages.length === 0) {
          setImageModalOpen(false);
        }

        // Mostrar mensaje de éxito y recargar página
        alert(`Imagen eliminada exitosamente: ${result.deleted_file}`);
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al eliminar imagen');
      }
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Error al eliminar la imagen: ' + error.message);
    }
  };

  const getRows = () => {
    console.log('🔍 getRows - items recibidos:', items);

    const rows = items.map((item, index) => {
      // Debug específico para detalles
      if (index === 0) {
        console.log('🔍 getRows - procesando primer item:', item);
        console.log('🔍 getRows - item.detalles:', item.detalles);
        console.log('🔍 getRows - typeof item.detalles:', typeof item.detalles);
      }

      return {
        id: item.id, // Assuming `items` have an `id` property
        name: item.name,
        price_MN: (item.price).toFixed(2),
        price_USD: (item.price_USD).toFixed(2),
        precio: `${(item.price).toFixed(2)} MN - ${(item.price_USD).toFixed(2)} USD`,
        cost: item.cost,
        tax: item.tax,
        show_price: `${(item.price).toFixed(2)}MN - ${(item.price_USD).toFixed(2)}USD`,
        cant: item.cant,
        category: item.category,
        detalles: item.detalles || '', // Include detalles field
        seller: item.seller,
        images: item.images || [], // Agregar imágenes
        firstImage: item.images && item.images.length > 0 ? item.images[0] : null, // Primera imagen para mostrar

        // Campos calculados como string display
        total_price: `${(item.price * item.cant).toFixed(2)} MN - ${(item.price_USD * item.cant).toFixed(2)} USD`,
        inversion: `${((((item.cost + item.tax) * tasaCambio)) * item.cant).toFixed(2)} MN - ${((item.cost + item.tax) * item.cant).toFixed(2)} USD`,
        revenue: `${((item.price * item.cant) - ((item.cost + item.tax) * tasaCambio) * item.cant).toFixed(2)} MN - ${((item.price_USD * item.cant) - ((item.cost + item.tax) * item.cant)).toFixed(2)} USD`,

        // Campos individuales para edición
        total_price_MN: (item.price * item.cant).toFixed(2),
        total_price_USD: (item.price_USD * item.cant).toFixed(2),
        inversion_MN: ((((item.cost + item.tax) * tasaCambio)) * item.cant).toFixed(2),
        inversion_USD: ((item.cost + item.tax) * item.cant).toFixed(2),
        revenue_MN: ((item.price * item.cant) - ((item.cost + item.tax) * tasaCambio) * item.cant).toFixed(2),
        revenue_USD: ((item.price_USD * item.cant) - ((item.cost + item.tax) * item.cant)).toFixed(2)

        // ... other calculations based on item properties
      };
    });
    return rows
  }

  // Función helper para calcular anchos responsive (optimizados para evitar scroll)
  const getColumnWidth = (mobileWidth, tabletWidth, laptopWidth, desktopWidth = laptopWidth, fieldName) => {
    if (isMobile) {
      // Sistema de acordeón para móvil
      if (expandedColumn === fieldName) {
        return mobileWidth * 2; // Columna expandida es más ancha
      } else if (expandedColumn && expandedColumn !== fieldName) {
        return mobileWidth * 0.3; // Columnas colapsadas son más estrechas
      } else {
        return mobileWidth * 0.6; // Estado normal
      }
    }
    if (isTablet) return tabletWidth * 0.85;
    if (isSmallLaptop) return laptopWidth * 0.95;
    return isLargeLaptop ? desktopWidth : laptopWidth;
  };

  // Función para determinar qué columnas ocultar en diferentes dispositivos (más agresiva)
  const shouldHideColumn = (column) => {
    // En móvil: mostrar solo columnas esenciales (name, firstImage, cant, precio, actions)
    const hideOnMobile = ['status', 'costo', 'sales', 'inversion', 'revenue', 'detalles', 'item_id'];
    const hideOnTablet = ['sales', 'status', 'inversion'];
    const hideOnSmallLaptop = ['sales'];

    if (isMobile && hideOnMobile.includes(column)) return true;
    if (isTablet && !isMobile && hideOnTablet.includes(column)) return true;
    if (isSmallLaptop && !isTablet && hideOnSmallLaptop.includes(column)) return true;
    return false;
  }; { /* ok voy a crear un producto, nombre: cadena de plata , costo(lo que me costo):50 , moneda: USD , Precio(precio al que lo voy a vender): 100000 MN , cantidad :2 , Detalles : buena cadena de plata, imagenes: 3 , categoria: Accesorios, Pais(country): otro (esto significa que hay taxes o sea ) */ }
  const columns = [
    {
      field: 'name',
      headerName: isMobile ? (expandedColumn === 'name' ? 'Product' : 'Prod') : 'Product',
      width: getColumnWidth(120, 160, 200, 250, 'name'),
      editable: true,
      flex: isMobile ? 0 : 0, // Usar ancho fijo en móvil para acordeón
      renderHeader: (params) => (
        <Box
          onClick={() => handleColumnHeaderClick('name')}
          sx={{
            cursor: isMobile ? 'pointer' : 'default',
            width: '100%',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {isMobile ? (expandedColumn === 'name' ? 'Product' : 'Prod') : 'Product'}
          </Typography>
        </Box>
      ),
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
          <Typography
            variant="body2"
            fontWeight="500"
            sx={{
              fontSize: isMobile ? '0.75rem' : isTablet ? '0.8rem' : '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: expandedColumn === 'name' && isMobile ? 'normal' : 'nowrap'
            }}
          >
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'firstImage',
      headerName: isMobile ? (expandedColumn === 'firstImage' ? 'Photo' : 'Img') : 'Photo',
      width: getColumnWidth(50, 70, 80, 90, 'firstImage'),
      editable: false,
      sortable: false,
      filterable: false,
      renderHeader: (params) => (
        <Box
          onClick={() => handleColumnHeaderClick('firstImage')}
          sx={{
            cursor: isMobile ? 'pointer' : 'default',
            width: '100%',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {isMobile ? (expandedColumn === 'firstImage' ? 'Photo' : 'Img') : 'Photo'}
          </Typography>
        </Box>
      ),
      renderCell: (params) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            cursor: 'pointer'
          }}
          onClick={() => {
            if (params.row.images && params.row.images.length > 0) {
              // Si tiene imágenes, abrir el modal de gestión
              openImageModal(params.row.images, 0, params.row);
            } else {
              // Si no tiene imágenes, abrir el selector de archivos
              setSelectedItem(params.row);
              setShowImageUploader(true);
            }
          }}
        >
          {params.value ? (
            <Box sx={{ position: 'relative' }}>
              <img
                src={getImageUrl(params.value)}
                alt="Product"
                style={{
                  width: isMobile ? 32 : 40,   // Imágenes más pequeñas en móvil
                  height: isMobile ? 32 : 40,  // Imágenes más pequeñas en móvil
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
                onError={(e) => {
                  // Si falla la imagen local, intentar la remota
                  if (!e.target.src.includes('cubaunify.uk')) {
                    e.target.src = params.value.startsWith('http') ? params.value : `https://cubaunify.uk${params.value}`;
                  } else {
                    // Si también falla la remota, mostrar placeholder
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div style="width:40px;height:40px;background:#f0f0f0;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#666;">No Img</div>';
                  }
                }}
              />
              {params.row.images && params.row.images.length > 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    backgroundColor: '#1976d2',
                    color: 'white',
                    borderRadius: '50%',
                    width: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  {params.row.images.length}
                </Box>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                width: 40,
                height: 40,
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: '#999',
                border: '2px dashed #ddd',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#e3f2fd',
                  borderColor: '#1976d2',
                  color: '#1976d2'
                }
              }}
              title="Haz clic para agregar fotos"
            >
              📷
            </Box>
          )}
        </Box>
      ),
    },
    {
      field: 'sku',
      headerName: 'ID',
      width: getColumnWidth(60, 70, 80, 90),
      editable: false,
      renderCell: (params) => (
        <Typography
          variant="body2"
          color="text.secondary"
          fontWeight="500"
          sx={{ fontSize: isMobile ? '0.75rem' : isTablet ? '0.8rem' : '0.875rem' }}
        >
          {params.row.id ? params.row.id.slice(-4) : 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: getColumnWidth(90, 100, 120, 140),
      editable: false,
      hide: shouldHideColumn('status'),
      renderCell: (params) => {
        const quantity = params.row.cant || 0;
        let status = 'In Stock';
        let color = 'success';
        let icon = '●';

        if (quantity === 0) {
          status = 'Out of Stock';
          color = 'error';
          icon = '●';
        } else if (quantity <= 5) {
          status = 'Restocking';
          color = 'warning';
          icon = '⚠';
        }

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FiberManualRecordIcon
              sx={{
                color: color === 'success' ? '#4caf50' :
                  color === 'warning' ? '#ff9800' : '#f44336',
                fontSize: '12px'
              }}
            />
            <Typography variant="body2" fontWeight="500">
              {status}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'cant',
      headerName: isMobile ? (expandedColumn === 'cant' ? 'Stock' : 'Stk') : 'Stock',
      width: getColumnWidth(70, 80, 100, 120, 'cant'),
      editable: true,
      type: 'number',
      renderHeader: (params) => (
        <Box
          onClick={() => handleColumnHeaderClick('cant')}
          sx={{
            cursor: isMobile ? 'pointer' : 'default',
            width: '100%',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {isMobile ? (expandedColumn === 'cant' ? 'Stock' : 'Stk') : 'Stock'}
          </Typography>
        </Box>
      ),
      renderCell: (params) => (
        <Typography
          variant="body2"
          fontWeight="500"
          textAlign="center"
          sx={{ fontSize: isMobile ? '0.75rem' : isTablet ? '0.8rem' : '0.875rem' }}
        >
          {params.value || 0}
        </Typography>
      ),
    },
    {
      field: 'precio',
      headerName: isMobile ? (expandedColumn === 'precio' ? 'Price' : 'Prc') : 'Price',
      width: getColumnWidth(100, 120, 150, 180, 'precio'),
      editable: true,
      flex: isMobile ? 0 : 0, // Usar ancho fijo para acordeón
      renderHeader: (params) => (
        <Box
          onClick={() => handleColumnHeaderClick('precio')}
          sx={{
            cursor: isMobile ? 'pointer' : 'default',
            width: '100%',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {isMobile ? (expandedColumn === 'precio' ? 'Price' : 'Prc') : 'Price'}
          </Typography>
        </Box>
      ),
      renderCell: (params) => {
        const priceMN = parseFloat(params.row.price_MN || params.row.price || 0);
        const priceUSD = parseFloat(params.row.price_USD || 0);

        if (isMobile) {
          if (expandedColumn === 'precio') {
            // Mostrar formato completo cuando está expandido
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.2, fontWeight: 500 }}>
                  {priceMN.toLocaleString()} MN
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.2, color: 'text.secondary' }}>
                  ${priceUSD.toFixed(2)} USD
                </Typography>
              </Box>
            );
          } else {
            // Mostrar formato compacto cuando está colapsado
            return (
              <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem' }}>
                ${priceUSD.toFixed(0)}
              </Typography>
            );
          }
        }

        // En tablet/desktop, formato compacto con números completos
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.2, fontWeight: 500 }}>
              {priceMN.toLocaleString()} MN
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.2, fontWeight: 500 }}>
              {priceUSD.toLocaleString()} USD
            </Typography>
          </Box>
        );
      },
      renderEditCell: (params) => {
        const currentChanges = editingChanges[params.id] || {};
        const currentPriceMN = currentChanges.price_MN || params.row.price_MN || params.row.price || 0;
        const currentPriceUSD = currentChanges.price_USD || params.row.price_USD || 0;

        return (
          <Box
            display="flex"
            gap={isMobile ? 0.5 : 1}
            alignItems="center"
            flexDirection={isMobile ? 'column' : 'row'}
            sx={{ width: '100%' }}
          >
            <TextField
              size={isMobile ? 'small' : 'small'}
              label="MN"
              type="number"
              key={`mn-${params.id}-${currentPriceMN}`} // Force re-render
              defaultValue={currentPriceMN}
              onBlur={(e) => {
                const newValueMN = parseFloat(e.target.value) || 0;
                const calculatedUSD = parseFloat((newValueMN / tasaCambio).toFixed(2));
                setEditingChanges(prev => ({
                  ...prev,
                  [params.id]: {
                    ...prev[params.id],
                    // Solo actualizar campos relacionados con Price
                    price_MN: newValueMN,
                    price: newValueMN,  // Para el backend
                    price_USD: calculatedUSD,
                    precio: `${newValueMN} MN - ${calculatedUSD} USD`
                  }
                }));
              }}
              variant="outlined"
              sx={{ width: isMobile ? '100%' : '100px' }}
            />
            <TextField
              size={isMobile ? 'small' : 'small'}
              label="USD"
              type="number"
              key={`usd-${params.id}-${currentPriceUSD}`} // Force re-render
              defaultValue={currentPriceUSD}
              onBlur={(e) => {
                const newValueUSD = parseFloat(e.target.value) || 0;
                const calculatedMN = parseFloat((newValueUSD * tasaCambio).toFixed(2));
                setEditingChanges(prev => ({
                  ...prev,
                  [params.id]: {
                    ...prev[params.id],
                    // Solo actualizar campos relacionados con Price
                    price_USD: newValueUSD,
                    price_MN: calculatedMN,
                    price: calculatedMN,  // Para el backend
                    precio: `${calculatedMN} MN - ${newValueUSD} USD`
                  }
                }));
              }}
              variant="outlined"
              sx={{ width: isMobile ? '100%' : '100px' }}
            />
          </Box>
        );
      }
    },
    {
      field: 'costo',
      headerName: 'Costo',
      width: getColumnWidth(140, 160, 180, 200),
      editable: true,
      hide: shouldHideColumn('costo'),
      renderCell: (params) => {
        const costoUSD = parseFloat(params.row.cost) || 0;  // Usar params.row.cost, no inversion_USD
        const costoMN = (costoUSD * tasaCambio);

        if (isMobile) {
          // En móvil, mostrar solo USD
          return (
            <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.875rem' }}>
              ${costoUSD.toLocaleString()}
            </Typography>
          );
        }

        // En tablet/desktop, formato apilado con números completos
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.2, fontWeight: 500 }}>
              {costoMN.toLocaleString()} MN
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.2, fontWeight: 500 }}>
              ${costoUSD.toLocaleString()} USD
            </Typography>
          </Box>
        );
      },
      renderEditCell: (params) => {
        const currentChanges = editingChanges[params.id] || {};
        const currentCostMN = currentChanges.inversion_MN || (params.row.cost * tasaCambio).toFixed(2);
        const currentCostUSD = currentChanges.inversion_USD || params.row.cost || 0;

        return (
          <Box
            display="flex"
            gap={isMobile ? 0.5 : 1}
            alignItems="center"
            flexDirection={isMobile ? 'column' : 'row'}
            sx={{ width: '100%' }}
          >
            <TextField
              size="small"
              label="MN"
              type="number"
              key={`cost-mn-${params.id}-${currentCostMN}`} // Force re-render
              defaultValue={currentCostMN}
              onBlur={(e) => {
                const newValueMN = parseFloat(e.target.value) || 0;
                const calculatedUSD = parseFloat((newValueMN / tasaCambio).toFixed(2));
                setEditingChanges(prev => ({
                  ...prev,
                  [params.id]: {
                    ...prev[params.id],
                    // Solo actualizar campos relacionados con Costo
                    inversion_MN: newValueMN,
                    inversion_USD: calculatedUSD,
                    cost: calculatedUSD,  // Para el backend
                    costo: `${newValueMN} MN - ${calculatedUSD} USD`
                  }
                }));
              }}
              variant="outlined"
              sx={{ width: isMobile ? '100%' : '80px' }}
            />
            <TextField
              size="small"
              label="USD"
              type="number"
              key={`cost-usd-${params.id}-${currentCostUSD}`} // Force re-render
              defaultValue={currentCostUSD}
              onBlur={(e) => {
                const newValueUSD = parseFloat(e.target.value) || 0;
                const calculatedMN = parseFloat((newValueUSD * tasaCambio).toFixed(2));
                setEditingChanges(prev => ({
                  ...prev,
                  [params.id]: {
                    ...prev[params.id],
                    // Solo actualizar campos relacionados con Costo
                    inversion_USD: newValueUSD,
                    inversion_MN: calculatedMN,
                    cost: newValueUSD,  // Para el backend
                    costo: `${calculatedMN} MN - ${newValueUSD} USD`
                  }
                }));
              }}
              variant="outlined"
              sx={{ width: isMobile ? '100%' : '80px' }}
            />
          </Box>
        );
      }
    },
    {
      field: 'sales',
      headerName: 'Sales',
      width: getColumnWidth(60, 80, 100, 120),
      editable: false,
      hide: shouldHideColumn('sales'),
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="500" textAlign="center">
          {/* TODO: Conectar con tabla sales para contar ventas por ID */}
          0
        </Typography>
      ),
    },
    {
      field: 'inversion',
      headerName: 'Inversión',  // Nombre más corto
      width: getColumnWidth(100, 120, 140, 160), // Aumentado para números completos
      editable: false, // Cambiado a false - campo calculado automáticamente
      hide: shouldHideColumn('inversion'),
      renderCell: (params) => {
        // FÓRMULA CORRECTA: Inversión Total = costo * cantidad (SIN tax)
        const changes = editingChanges[params.id] || {};
        const currentCost = parseFloat(changes.cost || changes.inversion_USD || params.row.cost) || 0;
        const currentCant = parseFloat(changes.cant || params.row.cant) || 0;

        const inversionTotalUSD = (currentCost * currentCant);
        const inversionTotalMN = (currentCost * currentCant * tasaCambio);

        if (isMobile) {
          // En móvil, mostrar solo USD
          return (
            <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.875rem' }}>
              ${inversionTotalUSD.toFixed(0)}
            </Typography>
          );
        }

        // Formato compacto para tablet/desktop con números completos
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.2, fontWeight: 500 }}>
              {inversionTotalMN.toLocaleString()} MN
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.2, fontWeight: 500 }}>
              ${inversionTotalUSD.toLocaleString()} USD
            </Typography>
          </Box>
        );
      },
      renderEditCell: (params) => {
        return (
          <Box display="flex" gap={1} alignItems="center">
            <TextField
              size="small"
              label="MN"
              type="number"
              defaultValue={params.row.inversion_MN}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditingChanges(prev => ({
                  ...prev,
                  [params.id]: {
                    ...prev[params.id],
                    ...params.row,
                    inversion_MN: newValue,
                    inversion: `${newValue} MN - ${params.row.inversion_USD} USD`
                  }
                }));
              }}
              variant="outlined"
              sx={{ width: '100px' }}
            />
            <TextField
              size="small"
              label="USD"
              type="number"
              defaultValue={params.row.inversion_USD}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditingChanges(prev => ({
                  ...prev,
                  [params.id]: {
                    ...prev[params.id],
                    ...params.row,
                    inversion_USD: newValue,
                    inversion: `${params.row.inversion_MN} MN - ${newValue} USD`
                  }
                }));
              }}
              variant="outlined"
              sx={{ width: '100px' }}
            />
          </Box>
        );
      }
    },
    {
      field: 'revenue',
      headerName: 'Ganancia', // Nombre más corto
      width: getColumnWidth(100, 120, 140, 160), // Aumentado para números completos
      editable: false, // Cambiado a false - campo calculado automáticamente
      hide: shouldHideColumn('revenue'),
      renderCell: (params) => {
        // FÓRMULA CORRECTA: Ganancias Total = price * cantidad - inversión_total
        const changes = editingChanges[params.id] || {};
        const currentPriceMN = parseFloat(changes.price_MN || changes.price || params.row.price_MN || params.row.price) || 0;
        const currentPriceUSD = parseFloat(changes.price_USD || params.row.price_USD) || 0;
        const currentCost = parseFloat(changes.cost || changes.inversion_USD || params.row.cost) || 0;
        const currentCant = parseFloat(changes.cant || params.row.cant) || 0;

        // Inversión Total = costo * cantidad
        const inversionTotalUSD = currentCost * currentCant;
        const inversionTotalMN = currentCost * currentCant * tasaCambio;

        // Ganancias Total = price * cantidad - inversión_total
        const gananciaTotalMN = (currentPriceMN * currentCant) - inversionTotalMN;
        const gananciaTotalUSD = (currentPriceUSD * currentCant) - inversionTotalUSD;

        const isPositive = gananciaTotalMN >= 0;

        if (isMobile) {
          // En móvil, mostrar solo indicador +/- con valor USD
          return (
            <Typography
              variant="body2"
              fontWeight="500"
              color={isPositive ? "success.main" : "error.main"}
              sx={{ fontSize: '0.875rem' }}
            >
              {isPositive ? '+' : '-'}${Math.abs(gananciaTotalUSD).toLocaleString()}
            </Typography>
          );
        }

        // Formato compacto para tablet/desktop con números completos
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                lineHeight: 1.2,
                color: isPositive ? "success.main" : "error.main",
                fontWeight: 500
              }}
            >
              {isPositive ? '+' : '-'}{Math.abs(gananciaTotalMN).toLocaleString()} MN
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                color: isPositive ? "success.dark" : "error.dark",
                lineHeight: 1.2,
                fontWeight: 500
              }}
            >
              ${Math.abs(gananciaTotalUSD).toLocaleString()} USD
            </Typography>
          </Box>
        );
      },
      renderEditCell: (params) => {
        const currentChanges = editingChanges[params.id] || {};
        return (
          <Box display="flex" gap={1} alignItems="center">
            <TextField
              size="small"
              label="MN"
              type="number"
              defaultValue={currentChanges.revenue_MN !== undefined ? currentChanges.revenue_MN : params.row.revenue_MN}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditingChanges(prev => ({
                  ...prev,
                  [params.id]: {
                    ...prev[params.id],
                    revenue_MN: newValue
                  }
                }));
              }}
              variant="outlined"
              sx={{ width: '100px' }}
            />
            <TextField
              size="small"
              label="USD"
              type="number"
              defaultValue={currentChanges.revenue_USD !== undefined ? currentChanges.revenue_USD : params.row.revenue_USD}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditingChanges(prev => ({
                  ...prev,
                  [params.id]: {
                    ...prev[params.id],
                    revenue_USD: newValue
                  }
                }));
              }}
              variant="outlined"
              sx={{ width: '100px' }}
            />
          </Box>
        );
      }
    },
    {
      field: 'detalles',
      headerName: 'Detalles',
      width: getColumnWidth(80, 100, 120, 140),
      editable: false,
      sortable: false,
      renderCell: (params) => {
        const isExpanded = expandedRows.has(params.row.id);
        const hasDetails = params.row.detalles && params.row.detalles.trim() !== '';

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={isExpanded ? 'Contraer detalles' : 'Expandir detalles'}>
              <Box
                onClick={() => {
                  setExpandedRows(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(params.row.id)) {
                      newSet.delete(params.row.id);
                    } else {
                      newSet.add(params.row.id);
                    }
                    return newSet;
                  });
                }}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  p: 0.5,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
            </Tooltip>
            {hasDetails && (
              <FiberManualRecordIcon
                sx={{
                  fontSize: '8px',
                  color: 'primary.main'
                }}
              />
            )}
          </Box>
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: isMobile ? (expandedColumn === 'actions' ? 'Actions' : '') : 'Acciones',
      width: getColumnWidth(45, 70, 80, 90, 'actions'),
      cellClassName: 'actions',
      renderHeader: (params) => (
        <Box
          onClick={() => handleColumnHeaderClick('actions')}
          sx={{
            cursor: isMobile ? 'pointer' : 'default',
            width: '100%',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {isMobile ? (expandedColumn === 'actions' ? 'Actions' : '⚙') : 'Acciones'}
          </Typography>
        </Box>
      ),
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit || cellEditingRows.has(id);

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<SaveIcon />}
              label="Guardar"
              sx={{
                color: 'primary.main',
              }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancelar"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Editar"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Eliminar"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  // Crear array combinado con cambios aplicados para cálculos precisos
  const rowsWithChanges = orows.map(row => {
    const changes = editingChanges[row.id];
    if (changes) {
      return {
        ...row,
        ...changes,
        // Asegurar que price y cost estén actualizados para los cálculos
        price: changes.price || changes.price_MN || row.price,
        cost: changes.cost || changes.inversion_USD || row.cost
      };
    }
    return row;
  });

  // FÓRMULAS CORREGIDAS SEGÚN ESPECIFICACIÓN:
  // 1. Inversiones = suma de todas las inversiones individuales (costo * cantidad de cada producto)
  // 2. Ganancias = suma de sales * price de cada producto (ventas reales)
  // 3. Ganancias Proximadas = suma de todas las ganancias totales individuales (price * cantidad - inversión_total)

  const totalInversiones = rowsWithChanges.length > 0 ?
    rowsWithChanges.reduce((acc, item) => {
      const cost = parseFloat(item.cost) || 0;
      const cant = parseFloat(item.cant) || 0;
      return acc + (cost * cant); // Inversión individual = costo * cantidad
    }, 0) : 0;

  // TODO: Conectar con tabla sales para obtener ventas reales
  const totalGananciasReales = 0; // Por ahora 0, necesita conectar con sales

  const totalGananciasProximadas = rowsWithChanges.length > 0 ?
    rowsWithChanges.reduce((acc, item) => {
      const priceMN = parseFloat(item.price) || 0;  // Price en MN
      const priceUSD = parseFloat(item.price_USD) || 0;  // Price en USD
      const cost = parseFloat(item.cost) || 0;  // Costo en USD
      const cant = parseFloat(item.cant) || 0;

      // Inversión Total en USD = costo * cantidad
      const inversionTotalUSD = cost * cant;

      // Para los totales, trabajar en USD para consistencia
      // Ganancia Total en USD = price_USD * cantidad - inversión_total_USD
      const gananciaTotalUSD = (priceUSD * cant) - inversionTotalUSD;

      return acc + gananciaTotalUSD;
    }, 0) : 0;  // Mantener los totales MN y USD para compatibilidad
  const totalMN = rowsWithChanges.length > 0 ? Math.round((rowsWithChanges.reduce((acc, item) => acc + (parseFloat(item.price) * parseFloat(item.cant)), 0))) : 0;
  const totalUSD = rowsWithChanges.length > 0 ? Math.round((rowsWithChanges.reduce((acc, item) => acc + Math.round((parseFloat(item.price) * parseFloat(item.cant)) / tasaCambio), 0))) : 0;

  const handleCloseSnackbar = () => setSnackbar(null);

  const get_categories_by_seller = async () => {
    try {
      const response = await apiConfig.fetchWithFallback('get_categories_by_seller', {
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
        const errorData = await response.json();
        console.log('Error from get_categories_by_seller:', errorData)
      }
    } catch (error) {
      if (error.message === 'SERVER_ERROR') {
        console.log('All servers unavailable for get_categories_by_seller');
      } else {
        console.log('Network error in get_categories_by_seller:', error)
      }
    }
  }


  useEffect(() => {
    localStorage.setItem('totalMN', totalMN);
    localStorage.setItem('totalUSD', totalUSD);
    localStorage.setItem('totalInversiones', totalInversiones);
    localStorage.setItem('totalGananciasReales', totalGananciasReales);
    localStorage.setItem('totalGananciasProximadas', totalGananciasProximadas);

    // Debug: verificar si los items incluyen detalles
    console.log('🔍 ListItems useEffect - items recibidos:', items);
    if (items && items.length > 0) {
      console.log('🔍 Primer item completo:', items[0]);
      console.log('🔍 ¿Primer item tiene detalles?', 'detalles' in items[0], '- Valor:', items[0].detalles);
    }

    (async () => {
      await get_categories_by_seller();
    })();
    setRows(getRows())
  }, [items])

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

  // Funciones para edición en línea
  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id) => () => {
    // Capturar valores originales antes de editar
    const row = orows.find((row) => row.id === id);
    if (row) {
      setOriginalValues({
        ...originalValues,
        [id]: { ...row }
      });
    }
    // En modo cell, activar edición para toda la fila
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id) => () => {
    console.log('handleSaveClick called for id:', id);
    console.log('handleSaveClick - current editingChanges:', editingChanges);

    // Obtener el item con los cambios aplicados
    const baseItem = orows.find((row) => row.id === id);
    const changesForRow = editingChanges[id] || {};
    const itemWithChanges = { ...baseItem, ...changesForRow, id };

    console.log('handleSaveClick - baseItem:', baseItem);
    console.log('handleSaveClick - changesForRow:', changesForRow);
    console.log('handleSaveClick - itemWithChanges:', itemWithChanges);

    setItemToSave(itemWithChanges);
    setSaveConfirmOpen(true);
  }; const handleDeleteClick = (id) => () => {
    const item = orows.find((row) => row.id === id);
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleCancelClick = (id) => () => {
    // Simplemente limpiar los estados sin intentar manipular celdas activas
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    // Remover de cellEditingRows
    setCellEditingRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    // Limpiar valores originales al cancelar
    const newOriginalValues = { ...originalValues };
    delete newOriginalValues[id];
    setOriginalValues(newOriginalValues);

    // Limpiar cambios de edición al cancelar
    const newEditingChanges = { ...editingChanges };
    delete newEditingChanges[id];
    setEditingChanges(newEditingChanges);

    const editedRow = orows.find((row) => row.id === id);
    if (editedRow.isNew) {
      setRows(orows.filter((row) => row.id !== id));
    }
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  // Funciones para confirmación de acciones
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    console.log('confirmDelete - itemToDelete:', itemToDelete);

    try {
      const response = await apiConfig.fetchWithFallback(`delete/items/${itemToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('confirmDelete - response status:', response.status);
      console.log('confirmDelete - response ok:', response.ok);

      if (response.ok) {
        setRows(orows.filter((row) => row.id !== itemToDelete.id));
        setSnackbar({ children: 'Producto eliminado exitosamente', severity: 'success' });

        // Recargar datos para reflejar cambios
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        const errorData = await response.json();
        const errorMessage = typeof errorData.detail === 'string' ? errorData.detail : 'Error al eliminar el producto';
        setSnackbar({ children: errorMessage, severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setSnackbar({ children: 'Error de conexión al eliminar el producto', severity: 'error' });
    }

    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  // Función para procesar el guardado real (movida desde processRowUpdate)
  const actualSaveRow = async (rowId) => {
    try {
      // Obtener la fila actual del estado - prioritizar editingChanges si existe
      const currentRow = editingChanges[rowId] || orows.find(row => row.id === rowId);

      console.log('actualSaveRow - rowId:', rowId);
      console.log('actualSaveRow - editingChanges:', editingChanges);
      console.log('actualSaveRow - currentRow:', currentRow);

      if (!currentRow) {
        setSnackbar({ children: 'Error: fila no encontrada', severity: 'error' });
        return false;
      }

      // Obtener valores originales para comparar
      const originalRow = originalValues[rowId];

      // Función para comparar si hubo cambios reales
      const hasChanges = () => {
        if (!originalRow) {
          console.log('hasChanges - No hay originalRow, asumiendo cambios');
          return true; // Si no hay valores originales, asumir que hay cambios
        }

        console.log('hasChanges - originalRow:', originalRow);
        console.log('hasChanges - currentRow:', currentRow);

        const fieldsToCheck = [
          'name', 'cant', 'detalles', 'category',
          'price_MN', 'price_USD', 'price',  // precios
          'total_price_MN', 'total_price_USD',
          'inversion_MN', 'inversion_USD',
          'revenue_MN', 'revenue_USD'
        ];

        const changedFields = fieldsToCheck.filter(field => {
          const originalValue = originalRow[field];
          const newValue = currentRow[field];
          const hasChange = originalValue !== newValue && newValue !== undefined;

          if (hasChange) {
            console.log(`hasChanges - Campo ${field} cambió:`, {
              original: originalValue,
              new: newValue
            });
          }

          return hasChange;
        });

        console.log('hasChanges - campos que cambiaron:', changedFields);
        return changedFields.length > 0;
      };

      // Si no hay cambios reales, no procesar
      // TEMPORAL: Saltear verificación si hay editingChanges
      if (Object.keys(editingChanges).length > 0 && editingChanges[rowId]) {
        console.log('actualSaveRow - Detectados cambios en editingChanges, procesando...');
      } else if (!hasChanges()) {
        setSnackbar({ children: 'No se detectaron cambios', severity: 'info' });
        return true; // Retornar true porque no es un error
      }

      // Preparar datos para la API - OBJETO COMPLETO con cambios aplicados
      const baseRow = orows.find(row => row.id === rowId);
      if (!baseRow) {
        setSnackbar({ children: 'Error: no se encontró el item base', severity: 'error' });
        return false;
      }

      // Combinar datos base con cambios aplicados
      const updateData = {
        name: currentRow.name || baseRow.name || '',
        cant: parseInt(currentRow.cant || baseRow.cant) || 0,
        detalles: currentRow.detalles !== undefined ? currentRow.detalles : (baseRow.detalles || ''),
        cost: parseFloat(currentRow.cost || baseRow.cost) || 0,  // Usar cost directo, no inversion_USD
        price: parseFloat(currentRow.price || currentRow.price_MN || baseRow.price) || 0,
        price_USD: parseFloat(currentRow.price_USD || baseRow.price_USD) || 0,
        tax: parseFloat(currentRow.tax || baseRow.tax) || 0,
        category: currentRow.category !== undefined ? currentRow.category : (baseRow.category || ''),
        seller: currentRow.seller || baseRow.seller || ''
        // No enviar images para evitar problemas de conversión en edición
      };

      console.log('actualSaveRow - baseRow:', baseRow);
      console.log('actualSaveRow - currentRow:', currentRow);
      console.log('actualSaveRow - updateData completo a enviar:', updateData);

      // Debug adicional
      console.log('actualSaveRow - URL completa:', `edit/item/${rowId}`);
      console.log('actualSaveRow - Token:', token ? 'Presente' : 'No presente');
      console.log('actualSaveRow - apiConfig.currentBaseUrl:', apiConfig.currentBaseUrl);
      console.log('actualSaveRow - apiConfig.testMode:', apiConfig.testMode);
      console.log('actualSaveRow - apiConfig.isDevelopment:', apiConfig.isDevelopment);
      console.log('actualSaveRow - Username actual:', localStorage.getItem('username'));
      console.log('actualSaveRow - ¿Es admin?:', apiConfig.isUserAdmin());
      console.log('actualSaveRow - Window location:', window.location.href);

      // Llamada a la API para actualizar el producto
      const response = await apiConfig.fetchWithFallback(`edit/item/${rowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      console.log('actualSaveRow - response status:', response.status);
      console.log('actualSaveRow - response ok:', response.ok);

      if (response.ok) {
        // Reconstruir el string precio si se editaron los precios
        const updatedRow = { ...currentRow, isNew: false };
        const isPriceEdit = currentRow.price_MN !== undefined || currentRow.price_USD !== undefined;
        if (isPriceEdit) {
          updatedRow.precio = `${currentRow.price_MN || 0} MN - ${currentRow.price_USD || 0} USD`;
        }

        setRows(orows.map((row) => (row.id === rowId ? updatedRow : row)));
        setSnackbar({ children: 'Producto actualizado exitosamente', severity: 'success' });

        // Limpiar valores originales después del guardado exitoso
        const newOriginalValues = { ...originalValues };
        delete newOriginalValues[rowId];
        setOriginalValues(newOriginalValues);

        // Limpiar cambios de edición
        const newEditingChanges = { ...editingChanges };
        delete newEditingChanges[rowId];
        setEditingChanges(newEditingChanges);

        // Refresh rápido para mostrar los cambios actualizados
        setTimeout(() => {
          window.location.reload();
        }, 800);

        return true;
      } else {
        console.log('actualSaveRow - Error response status:', response.status);
        console.log('actualSaveRow - Error response headers:', response.headers);

        let errorData;
        try {
          errorData = await response.json();
          console.log('actualSaveRow - Error response data:', errorData);
        } catch (parseError) {
          console.log('actualSaveRow - Could not parse error response as JSON:', parseError);
          errorData = { detail: 'Error de servidor no identificado' };
        }

        const errorMessage = typeof errorData.detail === 'string' ? errorData.detail : 'Error al actualizar el producto';
        setSnackbar({ children: `Error ${response.status}: ${errorMessage}`, severity: 'error' });
        return false;
      }
    } catch (error) {
      console.error('Error updating product (catch block):', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);

      if (error.message === 'SERVER_ERROR') {
        setSnackbar({ children: 'Todos los servidores están inaccesibles', severity: 'error' });
      } else {
        setSnackbar({ children: `Error de conexión: ${error.message}`, severity: 'error' });
      }
      return false;
    }
  };

  // Función para recargar datos desde el servidor
  const reloadData = async () => {
    try {
      const response = await apiConfig.fetchWithFallback('get_seller_items', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const freshData = await response.json();
        console.log('Datos recargados desde servidor:', freshData);
        // Nota: Para evitar el reload, necesitaríamos callback al componente padre
        // Por ahora, los datos se actualizarán en la próxima carga natural
      }
    } catch (error) {
      console.error('Error al recargar datos:', error);
    }
  };

  const confirmSave = async () => {
    if (!itemToSave) return;

    const success = await actualSaveRow(itemToSave.id);
    if (success) {
      // Remover de cellEditingRows solo si el guardado fue exitoso
      setCellEditingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemToSave.id);
        return newSet;
      });

      // Regresar la fila al modo de vista
      setRowModesModel(prev => ({
        ...prev,
        [itemToSave.id]: { mode: GridRowModes.View }
      }));

      // Limpiar editingChanges después del guardado exitoso
      setEditingChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[itemToSave.id];
        return newChanges;
      });
    }

    setSaveConfirmOpen(false);
    setItemToSave(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const cancelSave = () => {
    if (itemToSave) {
      // Regresar la fila al modo de vista
      setRowModesModel(prev => ({
        ...prev,
        [itemToSave.id]: { mode: GridRowModes.View, ignoreModifications: true }
      }));

      // Remover de cellEditingRows
      setCellEditingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemToSave.id);
        return newSet;
      });
    }

    setSaveConfirmOpen(false);
    setItemToSave(null);
  };

  const handleIncrement = () => {
    setCant(cant + 1)
  }

  const handleRowSelectionModelChange = (newSelectionModel) => {
    if (newSelectionModel.length === 0) {
      setEdit(false)

      return;
    }
    else {
      setSell(false)
      setEdit(true)
      setCant(0)
      console.log('length:', newSelectionModel.length)
      const selectedRow = apiRef.current.getSelectedRows().values().next().value;
      console.log(selectedRow)
      console.log('newSM', newSelectionModel)
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
  const handleSell = async (e) => {
    // e.defaultPrevent()
    const selectedRow = apiRef.current.getSelectedRows().values().next().value;
    // console.log('E:',apiRef.current.);
    if (!selectedRow) {
      setSell(true)
      return;
    }
    if (selectedRow && cant > 0) {
      console.log('Cantidad:', cant)

      const data = {
        'name': selectedRow.name,
        'cant': cant,
        'gender': gender,
        'date': getDateTimeString(),
        'revenue': ((selectedRow.price) - ((selectedRow.cost * tasaCambio) + (selectedRow.tax * tasaCambio))) * cant,
        'revenue_USD': ((selectedRow.price / tasaCambio) - (selectedRow.cost + selectedRow.tax) * cant)
      }
      console.log(data)
      try {
        const response = await apiConfig.fetchWithFallback('create/sale', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        })

        if (response.ok) {
          const dataResponse = await response.json();
          setOpen(false)
          setSnackbar({ children: `Vendiste ${cant} ${selectedRow.name} ${cant * selectedRow.price} + para el bolsillo`, severity: 'success' })
          const timeoutId = setTimeout(() => {
            window.location.reload()
          }, 1500);
          return () => clearTimeout(timeoutId)
        }

      } catch (error) {
        console.log(error)
      }

    }
  }


  const handleDelete = async () => {
    const selectedRow = apiRef.current.getSelectedRows().values().next().value;
    if (selectedRow === undefined) {
      setDelete(!deleteI ? true : false)
    }
    if (selectedRow !== undefined) {
      console.log(selectedRow)
      let sms = `Vas a eliminar ${selectedRow.name} estas segur@?`
      if (window.confirm(sms)) {
        const response = await fetch(`${getApiUrl()}/delete/items/${selectedRow.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        })
        const dataResonse = await response.json()
        if (response.ok) {
          setSnackbar({ children: `Eliminaste ${selectedRow.cant} ${selectedRow.name} !`, severity: 'error' })
          const timeoutId = setTimeout(() => {
            window.location.reload()
          }, 1500);
          return () => clearTimeout(timeoutId)
        }
      }
    }
  }

  const handleC = () => {
    handleSell()
    console.log(orows)
  }




  return (
    <div>
      <ButtonGroup
        sx={{
          flexWrap: 'wrap',
          gap: isMobile ? 1 : 0,
          '& .MuiButton-root': {
            fontSize: isMobile ? '0.875rem' : '0.875rem', // Tamaño normal
            padding: isMobile ? '8px 16px' : '8px 16px' // Padding normal
          }
        }}
        orientation={isMobile ? 'horizontal' : 'horizontal'} // Mantener horizontal
        variant="contained" // Siempre contained
      >
        <Button
          color="primary"
          startIcon={<BadgeIcon />} // Siempre mostrar icono
          size="medium" // Tamaño normal
        >
          {isMobile ? `Hola ${username}` : `Welcome / Bienvenid@ : ${username}`}
        </Button>
        <Button
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => { navigate('/create') }}
          size="medium" // Tamaño normal
        >
          {isMobile ? 'Crear' : 'Crear Producto'}
        </Button>
        {(username == 'pedro') && (
          <Button
            color="primary"
            startIcon={<GroupAddIcon />} // Siempre mostrar icono
            onClick={() => { navigate('/createUser') }}
            size="medium" // Tamaño normal
          >
            {isMobile ? 'Usuario' : 'Registrar Usuario'}
          </Button>
        )}
        {edit && (
          <Button
            startIcon={<AttachMoneyIcon />}
            onTouchStart={() => { setOpen(true); console.log(open) }}
            onClick={() => { setOpen(true); console.log(open) }}
            size="medium" // Tamaño normal
          >
            Vender
          </Button>
        )}
        <PositionedMenu />
      </ButtonGroup>
      {<Dialog disableEscapeKeyDown open={open} onClose={(event, reason) => { reason !== 'backdropClick' ? setOpen(false) : setOpen(true) }}
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
                  marginLeft: 2,
                },
              }}
            >
              <Box sx={{ m: 3 }}>
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
                  startIcon={<AddIcon fontSize="small" />}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<CloseOutlinedIcon />} onClick={(e, reason) => { setCant(0); reason !== 'backdropClick' ? setOpen(false) : setOpen(true); console.log(e.details) }}>Cancel</Button>
          <Button startIcon={<SendIcon />} onClick={(event, reason) => { handleSell(reason) }}>Ok</Button>
        </DialogActions>
      </Dialog>}





      <div>
        <Paper sx={{
          height: {
            xs: 'calc(100vh - 200px)', // Móvil: menos altura para mostrar totales
            sm: 'calc(100vh - 160px)', // Tablet: más compacto  
            md: 'calc(100vh - 180px)', // Desktop: más compacto
            lg: '550px', // Pantallas grandes: altura moderada
            xl: '600px' // Pantallas extra grandes: altura moderada
          },
          width: '100%',
          overflow: 'hidden',
          mx: { xs: 0, sm: 'auto' },
          maxWidth: { xs: '100vw', sm: '100%' }, // En móvil usar todo el ancho disponible
          // Responsive borders and shadows
          borderRadius: { xs: 0, sm: 1, md: 2 },
          boxShadow: {
            xs: 'none',
            sm: '0 2px 4px rgba(0,0,0,0.1)',
            md: '0 4px 8px rgba(0,0,0,0.12)'
          },
          // Responsive margins - más compactos
          margin: { xs: 0, sm: 0.5, md: 1 },
          // Evitar overflow en móvil
          overflowX: { xs: 'auto', sm: 'hidden' },
        }}>
          <ThemeProvider theme={inventoryTheme}>
            <DataGrid
              rows={orows}
              columns={columns}
              apiRef={apiRef}
              editMode="row"
              rowModesModel={rowModesModel}
              onRowModesModelChange={setRowModesModel}

              // Configuración responsive
              columnBuffer={isMobile ? 1 : 5} // Reducir buffer para móvil
              columnThreshold={isMobile ? 1 : 5}
              rowHeight={isMobile ? 50 : isTablet ? 65 : 70} // Más compacto en móvil
              headerHeight={isMobile ? 45 : 56} // Header más compacto

              // Paginación responsive
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: isMobile ? 8 : isTablet ? 8 : 10, // Más elementos por página en móvil
                  },
                },
              }}
              pageSizeOptions={isMobile ? [5, 8, 15] : isTablet ? [5, 8, 15] : [5, 10, 15, 25]}

              // Scroll responsive
              scrollbarSize={isMobile ? 6 : 12} // Scrollbar más delgado en móvil

              // Density responsive
              density={isMobile ? 'compact' : isTablet ? 'standard' : 'comfortable'}

              // Mejoras para dispositivos táctiles
              disableColumnResize={isMobile}
              disableColumnReorder={isMobile}
              disableVirtualization={isMobile} // Deshabilitar virtualización en móvil para mejor performance
              hideFooterSelectedRowCount={isMobile}

              // Toolbar responsive
              slots={{
                toolbar: isMobile ? undefined : GridToolbar, // Ocultar toolbar en móvil para ahorrar espacio
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: !isMobile, // Ocultar búsqueda rápida en móvil
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
              onRowEditStart={(params) => {
                // Cuando se inicia la edición de una fila, agregar la fila al set de edición
                setCellEditingRows(prev => new Set([...prev, params.id]));

                // Capturar valores originales
                const row = orows.find((row) => row.id === params.id);
                if (row) {
                  setOriginalValues({
                    ...originalValues,
                    [params.id]: { ...row }
                  });
                }
              }}
              onRowEditStop={(params) => {
                // NO ejecutar processRowUpdate aquí - solo limpiar el tracking si se cancela
                if (params.reason === 'escapeKeyDown') {
                  setCellEditingRows(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(params.id);
                    return newSet;
                  });
                }
                // Para otros casos, mantener la fila en el tracking hasta que se presione guardar/cancelar
              }}
              processRowUpdate={(newRow, oldRow) => {
                // Solo capturar los cambios para procesarlos cuando se presione guardar
                console.log('processRowUpdate called with:', { newRow, oldRow });
                console.log('processRowUpdate - newRow.detalles:', newRow.detalles);
                console.log('processRowUpdate - oldRow.detalles:', oldRow.detalles);

                setEditingChanges(prev => {
                  const updated = {
                    ...prev,
                    [newRow.id]: newRow
                  };
                  console.log('processRowUpdate - updated editingChanges:', updated);
                  return updated;
                });

                // Actualizar las filas localmente para mostrar los cambios
                setRows(orows.map((row) => (row.id === newRow.id ? newRow : row)));

                // Retornar la nueva fila para que se muestre
                return newRow;
              }}
              onProcessRowUpdateError={(error) => {
                console.log('Row update error:', error);
              }}
              checkboxSelection
              disableMultipleRowSelection={!deleteI ? true : false}
              onRowSelectionModelChange={(params) => { handleRowSelectionModelChange(params) }}
              sx={{
                border: 0,
                height: '100%',
                width: '100%',
                marginBottom: '30px',
                marginTop: '10px',
                // Responsive adjustments
                '& .MuiDataGrid-main': {
                  minWidth: 0, // Permite scroll horizontal
                  overflow: 'auto',
                },
                '& .MuiDataGrid-virtualScroller': {
                  minWidth: 0,
                  overflow: 'auto',
                },
                '& .MuiDataGrid-columnHeaders': {
                  minHeight: isMobile ? '45px' : '56px', // Más compacto
                  '& .MuiDataGrid-columnHeader': {
                    fontSize: isMobile ? '0.7rem' : '0.875rem', // Texto más pequeño
                    fontWeight: 600,
                    padding: isMobile ? '4px' : '8px', // Menos padding
                  }
                },
                '& .MuiDataGrid-cell': {
                  padding: isMobile ? '2px 4px' : isTablet ? '6px 12px' : '8px 16px', // Menos padding en móvil
                  fontSize: isMobile ? '0.75rem' : isTablet ? '0.8rem' : '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                },
                '& .MuiDataGrid-row': {
                  minHeight: isMobile ? '50px' : isTablet ? '65px' : '70px', // Más compacto en móvil
                  maxHeight: isMobile ? '50px' : 'auto', // Limitar altura en móvil
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  }
                },
                // Mejorar scroll en dispositivos táctiles
                '& .MuiDataGrid-virtualScrollerContent': {
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                },
                // Responsive toolbar
                '& .MuiDataGrid-toolbarContainer': {
                  padding: isMobile ? '8px' : '12px 16px',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? 1 : 2,
                },
                // Footer responsive
                '& .MuiDataGrid-footerContainer': {
                  minHeight: isMobile ? '48px' : '52px',
                  '& .MuiTablePagination-root': {
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                  }
                },
                overflowX: 'auto',
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#c1c1c1',
                  borderRadius: '4px',
                },
              }}
              disableRowSelectionOnClick
              checkboxSelectionVisibleOnly
            />
          </ThemeProvider>
        </Paper>

        {/* Detalles expandibles */}
        {Array.from(expandedRows).map(rowId => {
          const row = orows.find(r => r.id === rowId);
          if (!row) return null;

          const isInEditMode = rowModesModel[rowId]?.mode === GridRowModes.Edit || cellEditingRows.has(rowId);

          return (
            <Paper
              key={`details-${rowId}`}
              sx={{
                mt: 1,
                p: 2,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderLeft: '4px solid #1976d2'
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#1976d2', fontWeight: 600 }}>
                Detalles de: {row.name}
              </Typography>

              {isInEditMode ? (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Escribe los detalles del producto aquí..."
                  defaultValue={row.detalles || ''}
                  onChange={(e) => {
                    setEditingChanges(prev => ({
                      ...prev,
                      [rowId]: {
                        ...prev[rowId],
                        ...row,
                        detalles: e.target.value
                      }
                    }));
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                    }
                  }}
                />
              ) : (
                <Box
                  onClick={() => {
                    if (!isInEditMode) {
                      handleEditClick(rowId)();
                    }
                  }}
                  sx={{
                    minHeight: '60px',
                    p: 2,
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      borderColor: '#1976d2'
                    }
                  }}
                >
                  {row.detalles && row.detalles.trim() !== '' ? (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {row.detalles}
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontStyle: 'italic'
                      }}
                    >
                      Haz clic para agregar detalles...
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          );
        })}

        {/* Totales como componente separado antes del paginador */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 1 : 3,
            justifyContent: 'flex-end',
            alignItems: isMobile ? 'stretch' : 'center',
            mt: 2,
            mb: 1,
            px: isMobile ? 1 : 2,
            py: 1,
            bgcolor: 'rgba(245,245,245,0.8)',
            borderRadius: 1,
            fontSize: isMobile ? '12px' : '14px'
          }}
        >
          {/**<List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
            <ListItem>
              <ListItemAvatar>
                <Avatar  >
                  <AttachMoneyIcon color='success' />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="Dinero Total:" secondary={`${totalMN.toFixed(2)} MN - ${totalUSD.toFixed(2)} USD`} />
            </ListItem>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ background: 'red' }}>
                  <RemoveIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Inversiones (Suma de costo * cantidad):"
                secondary={`${(totalInversiones * tasaCambio).toFixed(2)} MN - ${totalInversiones.toFixed(2)} USD`}
                sx={{
                  '& .MuiListItemText-primary': { color: 'error.main' },
                  '& .MuiListItemText-secondary': { color: 'error.main' }
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ background: 'blue' }}>
                  <AttachMoneyIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Ganancias (Ventas reales):"
                secondary={`${(totalGananciasReales * tasaCambio).toFixed(2)} MN - ${totalGananciasReales.toFixed(2)} USD`}
                sx={{
                  '& .MuiListItemText-primary': { color: totalGananciasReales >= 0 ? 'success.main' : 'error.main' },
                  '& .MuiListItemText-secondary': { color: totalGananciasReales >= 0 ? 'success.main' : 'error.main' }
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ background: 'Green' }}>
                  <TrendingUpIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Ganancias Proximadas (Si vendes todo):"
                secondary={`${(totalGananciasProximadas * tasaCambio).toFixed(2)} MN - ${totalGananciasProximadas.toFixed(2)} USD`}
                sx={{
                  '& .MuiListItemText-primary': { color: totalGananciasProximadas >= 0 ? 'success.main' : 'error.main' },
                  '& .MuiListItemText-secondary': { color: totalGananciasProximadas >= 0 ? 'success.main' : 'error.main' }
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ background: 'blue' }}>
                  <CurrencyExchangeIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="Tasa de Cambio:" />
              <TextField value={tasaCambio} onChange={(e) => { handleTasaCambioChange(e) }} />
            </ListItem>

          </List> **/}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
            <Avatar sx={{ background: 'red', width: isMobile ? 20 : 24, height: isMobile ? 20 : 24 }}>
              <RemoveIcon sx={{ fontSize: isMobile ? 12 : 14 }} />
            </Avatar>
            <Typography variant="body2" sx={{ color: '#666', fontSize: isMobile ? '0.875rem' : 'inherit' }}>
              Inversiones: <span style={{ color: '#f44336', fontWeight: 600 }}>
                {isMobile ? `$${totalInversiones.toFixed(0)}` : `${(totalInversiones * tasaCambio).toFixed(2)} MN - ${totalInversiones.toFixed(2)} USD`}
              </span>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
            <Avatar sx={{ background: 'blue', width: isMobile ? 20 : 24, height: isMobile ? 20 : 24 }}>
              <AttachMoneyIcon sx={{ fontSize: isMobile ? 12 : 14 }} />
            </Avatar>
            <Typography variant="body2" sx={{ color: '#666', fontSize: isMobile ? '0.875rem' : 'inherit' }}>
              Ganancias Reales: <span style={{ color: totalGananciasReales >= 0 ? '#4caf50' : '#f44336', fontWeight: 600 }}>
                {isMobile ? `$${totalGananciasReales.toFixed(0)}` : `${(totalGananciasReales * tasaCambio).toFixed(2)} MN - ${totalGananciasReales.toFixed(2)} USD`}
              </span>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
            <Avatar sx={{ background: 'green', width: isMobile ? 24 : 24, height: isMobile ? 24 : 24 }}>
              <TrendingUpIcon sx={{ fontSize: isMobile ? 14 : 14 }} />
            </Avatar>
            <Typography variant="body2" sx={{ color: '#666', fontSize: isMobile ? '0.875rem' : 'inherit' }}>
              Gan. Proximadas: <span style={{ color: totalGananciasProximadas >= 0 ? '#4caf50' : '#f44336', fontWeight: 600 }}>
                {isMobile ? `$${totalGananciasProximadas.toFixed(0)}` : `${(totalGananciasProximadas * tasaCambio).toFixed(2)} MN - ${totalGananciasProximadas.toFixed(2)} USD`}
              </span>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
            <Avatar sx={{ background: 'blue', width: isMobile ? 20 : 24, height: isMobile ? 20 : 24 }}>
              <CurrencyExchangeIcon sx={{ fontSize: isMobile ? 12 : 14 }} />
            </Avatar>
            <Typography variant="body2" sx={{ color: '#666', mr: 1, fontSize: isMobile ? '0.875rem' : 'inherit' }}> {/* Tamaño normal */}
              Tasa de Cambio:
            </Typography>
            <TextField
              size="small"
              type="number"
              value={tasaCambio}
              onChange={handleTasaCambioChange}
              sx={{
                width: isMobile ? '70px' : '80px', // Un poco más ancho
                '& .MuiOutlinedInput-root': {
                  height: isMobile ? '32px' : '32px', // Altura normal
                  fontSize: isMobile ? '14px' : '14px', // Tamaño normal
                  fontWeight: 600,
                  color: '#1976d2'
                },
                '& .MuiOutlinedInput-input': {
                  padding: isMobile ? '6px 8px' : '6px 8px', // Padding normal
                  textAlign: 'center'
                }
              }}
              inputProps={{
                min: 1,
                max: 9999,
                step: 1
              }}
            />
          </Box>
        </Box>



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

        {/* Confirmación personalizada para borrar - sin Dialog */}
        {deleteConfirmOpen && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1300
            }}
          >
            <Paper
              sx={{
                p: 3,
                maxWidth: 400,
                mx: 2,
                textAlign: 'center'
              }}
            >
              <h3>Confirmar eliminación</h3>
              <p>
                {itemToDelete && `¿Estás seguro que quieres borrar: ${itemToDelete.cant} ${itemToDelete.name}?`}
              </p>
              <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button onClick={cancelDelete} variant="outlined">
                  Cancelar
                </Button>
                <Button onClick={confirmDelete} variant="contained" color="error">
                  Confirmar
                </Button>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Confirmación personalizada para guardar - sin Dialog */}
        {saveConfirmOpen && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1300
            }}
          >
            <Paper
              sx={{
                p: 3,
                maxWidth: 400,
                mx: 2,
                textAlign: 'center'
              }}
            >
              <h3>Confirmar cambios</h3>
              <p>
                {itemToSave && `¿Estás seguro que quieres editar ${itemToSave.name}?`}
              </p>
              <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button onClick={cancelSave} variant="outlined">
                  Cancelar
                </Button>
                <Button onClick={confirmSave} variant="contained" color="primary">
                  Confirmar
                </Button>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Modal para mostrar imágenes en grande */}
        <Dialog
          open={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(5px)',
            }
          }}
        >
          <DialogTitle sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Imágenes del Producto ({currentImageIndex + 1} de {selectedImages.length})
            </Typography>
            <IconButton onClick={() => setImageModalOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 400 }}>
            {selectedImages.length > 0 && (
              <>
                {/* Botón anterior */}
                {selectedImages.length > 1 && (
                  <IconButton
                    onClick={prevImage}
                    sx={{
                      position: 'absolute',
                      left: 16,
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                      zIndex: 1
                    }}
                  >
                    <ArrowBackIosIcon />
                  </IconButton>
                )}

                {/* Imagen principal */}
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                  <img
                    src={getImageUrl(selectedImages[currentImageIndex])}
                    alt={`Product ${currentImageIndex + 1}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                    onError={(e) => {
                      // Fallback para cubaunify.uk
                      if (!e.target.src.includes('cubaunify.uk')) {
                        e.target.src = selectedImages[currentImageIndex]?.startsWith('http')
                          ? selectedImages[currentImageIndex]
                          : `https://cubaunify.uk${selectedImages[currentImageIndex]}`;
                      }
                    }}
                  />
                </Box>

                {/* Botón siguiente */}
                {selectedImages.length > 1 && (
                  <IconButton
                    onClick={nextImage}
                    sx={{
                      position: 'absolute',
                      right: 16,
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                      zIndex: 1
                    }}
                  >
                    <ArrowForwardIosIcon />
                  </IconButton>
                )}
              </>
            )}
          </DialogContent>

          {/* Miniaturas en la parte inferior y botones de gestión */}
          {selectedImages.length > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pb: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                {selectedImages.map((image, index) => (
                  <Box
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    sx={{
                      width: 60,
                      height: 60,
                      cursor: 'pointer',
                      border: index === currentImageIndex ? '2px solid #1976d2' : '2px solid transparent',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      opacity: index === currentImageIndex ? 1 : 0.7,
                      transition: 'all 0.2s ease',
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`Thumbnail ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        if (!e.target.src.includes('cubaunify.uk')) {
                          e.target.src = image.startsWith('http') ? image : `https://cubaunify.uk${image}`;
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Botones de gestión de imágenes */}
          <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
            {/* Input oculto para subir archivos */}
            <input
              type="file"
              multiple
              accept="image/*,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.tiff,.tif"
              style={{ display: 'none' }}
              id="upload-images-input"
              onChange={handleAddImages}
            />

            {/* Botón para agregar imágenes */}
            <label htmlFor="upload-images-input">
              <Button
                component="span"
                variant="contained"
                startIcon={<PhotoCameraIcon />}
                disabled={isUploadingImages || !selectedItem}
                sx={{
                  backgroundColor: '#4caf50',
                  '&:hover': { backgroundColor: '#45a049' }
                }}
              >
                {isUploadingImages ? 'Subiendo...' : 'Agregar Fotos'}
              </Button>
            </label>

            {/* Botón para eliminar imagen actual */}
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={handleRemoveImage}
              disabled={selectedImages.length === 0}
            >
              Eliminar Esta Foto
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para subir imágenes cuando no hay ninguna */}
        <Dialog
          open={showImageUploader}
          onClose={() => setShowImageUploader(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6">
              Agregar Fotos al Producto
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedItem?.name}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <input
                type="file"
                multiple
                accept="image/*,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.tiff,.tif"
                style={{ display: 'none' }}
                id="upload-initial-images"
                onChange={async (event) => {
                  const files = Array.from(event.target.files);
                  if (files.length === 0 || !selectedItem) return;

                  setIsUploadingImages(true);
                  const formData = new FormData();
                  files.forEach(file => formData.append('files', file));

                  try {
                    const response = await apiConfig.fetchWithFallback(`items/${selectedItem.id}/add-images`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: formData
                    });

                    if (response.ok) {
                      const result = await response.json();
                      // Cerrar el modal de upload
                      setShowImageUploader(false);
                      // Mostrar mensaje de éxito
                      alert(`${result.new_images.length} imágenes agregadas exitosamente`);
                      // Hacer refresh completo de la página para ver los cambios
                      window.location.reload();
                    } else {
                      throw new Error('Error al subir imágenes');
                    }
                  } catch (error) {
                    console.error('Error uploading images:', error);
                    alert('Error al subir las imágenes');
                  } finally {
                    setIsUploadingImages(false);
                    event.target.value = '';
                  }
                }}
              />

              <label htmlFor="upload-initial-images">
                <Box
                  sx={{
                    border: '2px dashed #1976d2',
                    borderRadius: '8px',
                    padding: '40px 20px',
                    cursor: 'pointer',
                    backgroundColor: '#f8f9fa',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#e3f2fd',
                      borderColor: '#1565c0'
                    }
                  }}
                >
                  <PhotoCameraIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {isUploadingImages ? 'Subiendo imágenes...' : 'Seleccionar Fotos'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Haz clic aquí para seleccionar múltiples imágenes
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Formatos: JPG, PNG, GIF
                  </Typography>
                </Box>
              </label>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowImageUploader(false)}
              disabled={isUploadingImages}
            >
              Cancelar
            </Button>
          </DialogActions>
        </Dialog>

      </div>
    </div>
  );
}
export default ListItems;
