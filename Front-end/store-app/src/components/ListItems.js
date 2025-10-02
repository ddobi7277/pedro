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
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { ButtonGroup, TextField, Tooltip } from "@mui/material";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
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
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { grey, blueGrey } from '@mui/material/colors';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

// Tema personalizado para la tabla
const inventoryTheme = createTheme({
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: '12px',
          overflow: 'hidden',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: blueGrey[50],
            borderRadius: '0',
            borderBottom: `1px solid ${grey[200]}`,
            color: 'text.secondary',
          },
          '& .MuiDataGrid-columnHeader': {
            padding: '0 16px',
            borderRight: 'none',
          },
          '& .MuiDataGrid-cell': {
            padding: '0 16px',
            borderBottom: `1px solid ${grey[100]}`,
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.875rem',
            '&:focus, &:focus-within': {
              outline: 'none',
            },
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
            fontSize: '0.875rem',
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
  const apiRef = useGridApiRef()
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const [sell, setSell] = useState(false);
  const [deleteI, setDelete] = useState(false);
  const [token,] = useState(localStorage.getItem('token'));
  const [tasaCambio, setTazaCambio] = useState(
    parseInt(localStorage.getItem('tasaCambio')) || 360
  );
  const [cant, setCant] = useState(0);
  const [gender, setGender] = useState('Masculino');
  const [category, setCategory] = useState([]);
  const [selectedItem, setSelectedItem] = useState({});
  const [orows, setRows] = useState([]);
  const [open, setOpen] = React.useState(false);

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
  const [expandedRows, setExpandedRows] = useState(new Set()); const getRows = () => {
    const rows = items.map((item) => ({
      id: item.id, // Assuming `items` have an `id` property
      name: item.name,
      price_MN: (item.price).toFixed(2),
      price_USD: (item.price_USD).toFixed(2),
      precio: `${(item.price).toFixed(2)} MN - ${(item.price_USD).toFixed(2)} USD`,
      cost: item.cost,
      tax: item.tax,
      show_price: `${(item.price).toFixed(2)}MN - ${(item.price / tasaCambio).toFixed(2)}USD`,
      cant: item.cant,
      category: item.category,
      detalles: item.detalles || '', // Include detalles field
      seller: item.seller,

      // Campos calculados como string display
      total_price: `${(item.price * item.cant).toFixed(2)} MN - ${(item.price_USD * item.cant).toFixed(2)} USD`,
      inversion: `${((((item.cost + item.tax) * tasaCambio)) * item.cant).toFixed(2)} MN - ${((item.cost + item.tax) * item.cant).toFixed(2)} USD`,
      revenue: `${((item.price * item.cant) - ((item.cost + item.tax) * tasaCambio) * item.cant).toFixed(2)} MN - ${(((item.price / tasaCambio) * item.cant) - ((item.cost + item.tax) * item.cant)).toFixed(2)} USD`,

      // Campos individuales para edición
      total_price_MN: (item.price * item.cant).toFixed(2),
      total_price_USD: (item.price_USD * item.cant).toFixed(2),
      inversion_MN: ((((item.cost + item.tax) * tasaCambio)) * item.cant).toFixed(2),
      inversion_USD: ((item.cost + item.tax) * item.cant).toFixed(2),
      revenue_MN: ((item.price * item.cant) - ((item.cost + item.tax) * tasaCambio) * item.cant).toFixed(2),
      revenue_USD: (((item.price / tasaCambio) * item.cant) - ((item.cost + item.tax) * item.cant)).toFixed(2)

      // ... other calculations based on item properties
    }));
    return rows
  }

  const columns = [
    {
      field: 'name',
      headerName: 'Product',
      width: 250,
      editable: true,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: '#666'
            }}
          >
            IMG
          </Box>
          <Typography variant="body2" fontWeight="500">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'sku',
      headerName: 'ID',
      width: 80,
      editable: false,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" fontWeight="500">
          {params.row.id || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      editable: false,
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
      headerName: 'Stock',
      width: 100,
      editable: true,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="500" textAlign="center">
          {params.value || 0}
        </Typography>
      ),
    },
    {
      field: 'precio',
      headerName: 'Price',
      width: 200,
      editable: true,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="500">
          {params.value || `${params.row.price_MN || '0'} MN - ${params.row.price_USD || '0'} USD`}
        </Typography>
      ),
      renderEditCell: (params) => (
        <Box display="flex" gap={1} alignItems="center">
          <TextField
            size="small"
            label="MN"
            type="number"
            defaultValue={params.row.price_MN}
            onChange={(e) => {
              const newValue = e.target.value;
              setEditingChanges(prev => ({
                ...prev,
                [params.id]: {
                  ...prev[params.id],
                  ...params.row,
                  price_MN: newValue,
                  precio: `${newValue} MN - ${params.row.price_USD} USD`
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
            defaultValue={params.row.price_USD}
            onChange={(e) => {
              const newValue = e.target.value;
              setEditingChanges(prev => ({
                ...prev,
                [params.id]: {
                  ...prev[params.id],
                  ...params.row,
                  price_USD: newValue,
                  precio: `${params.row.price_MN || 0} MN - ${newValue} USD`
                }
              }));
            }}
            variant="outlined"
            sx={{ width: '100px' }}
          />
        </Box>
      )
    },
    {
      field: 'costo',
      headerName: 'Costo',
      width: 150,
      editable: true,
      renderCell: (params) => {
        const costo = parseFloat(params.row.inversion_USD) || 0;
        return (
          <Typography variant="body2" fontWeight="500" color="text.primary">
            ${costo.toFixed(2)} USD
          </Typography>
        );
      },
      renderEditCell: (params) => (
        <Box display="flex" gap={1} alignItems="center">
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
                  inversion: `${params.row.inversion_MN || 0} MN - ${newValue} USD`
                }
              }));
            }}
            variant="outlined"
            sx={{ width: '120px' }}
          />
        </Box>
      )
    },
    {
      field: 'sales',
      headerName: 'Sales',
      width: 100,
      editable: false,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="500" textAlign="center">
          {/* TODO: Conectar con tabla sales para contar ventas por ID */}
          0
        </Typography>
      ),
    },
    {
      field: 'inversion',
      headerName: 'Inversion Total',
      width: 200,
      editable: true,
      renderCell: (params) => {
        return <span>{params.value}</span>;
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
      headerName: 'Ganancias Total',
      width: 200,
      editable: true,
      renderCell: (params) => {
        return <span>{params.value}</span>;
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
      field: 'actions',
      type: 'actions',
      headerName: 'Acciones',
      width: 100,
      cellClassName: 'actions',
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
  const totalMN = items.length > 0 ? Math.round((items.reduce((acc, item) => acc + (item.price * item.cant), 0))) : 0;
  const totalUSD = items.length > 0 ? Math.round((items.reduce((acc, item) => acc + Math.round((item.price * item.cant) / tasaCambio), 0))) : 0;
  const totalInversion = items.length > 0 ? Math.round((items.reduce((acc, item) => acc + (item.cost + item.tax) * tasaCambio * item.cant, 0))) : 0;
  const totalGanancias = items.length > 0 ? Math.round((items.reduce((acc, item) => acc + (item.price * item.cant) - (((item.cost * item.cant * tasaCambio) + (item.tax * item.cant * tasaCambio))), 0))) : 0;

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
    localStorage.setItem('totalGanancias', totalGanancias);
    localStorage.setItem('totalInversion', totalInversion);
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
        cost: parseFloat(currentRow.cost || baseRow.cost) || 0,
        price: parseFloat(currentRow.price_MN || currentRow.price || baseRow.price) || 0,
        price_USD: parseFloat(currentRow.price_USD || baseRow.price_USD) || 0,
        tax: parseFloat(currentRow.tax || baseRow.tax) || 0,
        category: currentRow.category !== undefined ? currentRow.category : (baseRow.category || ''),
        seller: currentRow.seller || baseRow.seller || '',
        image: currentRow.image || baseRow.image || null
      };

      console.log('actualSaveRow - baseRow:', baseRow);
      console.log('actualSaveRow - currentRow:', currentRow);
      console.log('actualSaveRow - updateData completo a enviar:', updateData);

      // Llamada a la API para actualizar el producto - CORREGIR URL
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
        const errorData = await response.json();
        const errorMessage = typeof errorData.detail === 'string' ? errorData.detail : 'Error al actualizar el producto';
        setSnackbar({ children: errorMessage, severity: 'error' });
        return false;
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setSnackbar({ children: 'Error de conexión al actualizar el producto', severity: 'error' });
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
      <ButtonGroup>
        <Button color="primary" startIcon={<BadgeIcon />} >
          Welcome / Bienvenid@ : {username}
        </Button>
        <Button color="primary" startIcon={<AddIcon />} onClick={() => { navigate('/create') }}>
          Crear Producto
        </Button>
        {(username == 'pedro') && <Button color="primary" startIcon={<GroupAddIcon />} onClick={() => { navigate('/createUser') }}>Registrar Usuario</Button>}
        {edit && <Button startIcon={<AttachMoneyIcon />} onTouchStart={() => { setOpen(true); console.log(open) }} onClick={() => { setOpen(true); console.log(open) }}>Vender</Button>}
        { }
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
          height: '400px',
          width: '100%',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <ThemeProvider theme={inventoryTheme}>
            <DataGrid
              rows={orows}
              columns={columns}
              apiRef={apiRef}
              editMode="row"
              rowModesModel={rowModesModel}
              onRowModesModelChange={setRowModesModel}
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
              initialState={{ pagination: { paginationModel } }}
              pageSizeOptions={[5, 10, 15]}
              checkboxSelection
              disableMultipleRowSelection={!deleteI ? true : false}
              onRowSelectionModelChange={(params) => { handleRowSelectionModelChange(params) }}
              sx={{
                border: 0,
                height: '100%',
                width: '100%',
                marginBottom: '30px',
                marginTop: '10px'
              }}
              disableRowSelectionOnClick
              checkboxSelectionVisibleOnly
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
            />
          </ThemeProvider>

          {/* Footer con totales */}
          <Box
            sx={{
              position: 'absolute',
              bottom: '8px',
              right: '16px',
              display: 'flex',
              gap: 3,
              bgcolor: 'rgba(255,255,255,0.9)',
              px: 2,
              py: 1,
              borderRadius: 1,
              fontSize: '14px'
            }}
          >
            <Typography variant="body2" sx={{ color: '#666' }}>
              Inversiones: <span style={{ color: '#1976d2', fontWeight: 600 }}>${(totalInversion / tasaCambio).toFixed(0)}</span>
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Ganancias: <span style={{ color: '#1976d2', fontWeight: 600 }}>${(totalGanancias / tasaCambio).toFixed(0)}</span>
            </Typography>
          </Box>
        </Paper>

        <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
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
              primary="Inversión Total General:"
              secondary={`${(totalInversion).toFixed(2)} MN - ${(totalInversion / tasaCambio).toFixed(2)} USD`}
              sx={{
                '& .MuiListItemText-primary': { color: 'error.main' },
                '& .MuiListItemText-secondary': { color: 'error.main' }
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemAvatar>
              <Avatar sx={{ background: 'Green' }}>
                <AttachMoneyIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary="Ganancias General Totales:"
              secondary={`${totalGanancias.toFixed(2)} MN - ${(totalGanancias / tasaCambio).toFixed(2)} USD`}
              sx={{
                '& .MuiListItemText-primary': { color: totalGanancias >= 0 ? 'success.main' : 'error.main' },
                '& .MuiListItemText-secondary': { color: totalGanancias >= 0 ? 'success.main' : 'error.main' }
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

      </div>
    </div>
  );
}
export default ListItems;
