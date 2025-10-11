import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Grid,
    Container,
    Box,
    Chip,
    Paper,
    Alert,
    CircularProgress
} from '@mui/material';
import { getApiUrl, apiConfig } from '../config/apiConfig';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8],
    },
}));

const ProductImage = styled(CardMedia)({
    height: 200,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
});

const PriceChip = styled(Chip)(({ theme }) => ({
    fontSize: '1rem',
    fontWeight: 'bold',
    padding: theme.spacing(1),
}));

export default function PublicStore() {
    const { seller } = useParams(); // Get seller from URL parameters
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        fetchStoreData();
    }, [seller]);

    const fetchStoreData = async () => {
        try {
            setLoading(true);

            console.log(`[STORE] Fetching data for seller: ${seller}`);

            // Fetch items from public endpoint using apiConfig with fallback
            const itemsData = await apiConfig.fetchWithFallback(`/store/${seller}/items`);
            setItems(itemsData);
            console.log(`[STORE] Loaded ${itemsData.length} items for ${seller}`);

            // Fetch categories from public endpoint using apiConfig with fallback
            const categoriesData = await apiConfig.fetchWithFallback(`/store/${seller}/categories`);
            setCategories(categoriesData);
            console.log(`[STORE] Loaded ${categoriesData.length} categories for ${seller}`);

        } catch (err) {
            console.error(`[STORE] Error fetching store data for ${seller}:`, err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = selectedCategory
        ? items.filter(item => item.category === selectedCategory)
        : items;

    // Componente para mostrar todas las imágenes de un producto
    const ProductImagesCarousel = ({ images, name }) => {
        if (!images || images.length === 0) {
            return <ProductImage image={'/placeholder-product.svg'} title={name} />;
        }
        // Si solo hay una imagen, mostrarla
        if (images.length === 1) {
            const img = images[0];
            const match = img.match(/^\/uploads\/(.*?)\/(.*?)\/(.+)$/);
            const src = match ? `${getApiUrl()}/secure-uploads/${match[1]}/${match[2]}/${match[3]}` : img;
            return <ProductImage image={src} title={name} />;
        }
        // Si hay varias, mostrar la primera y miniaturas
        const [main, ...thumbs] = images;
        const match = main.match(/^\/uploads\/(.*?)\/(.*?)\/(.+)$/);
        const mainSrc = match ? `${getApiUrl()}/secure-uploads/${match[1]}/${match[2]}/${match[3]}` : main;
        return (
            <Box>
                <ProductImage image={mainSrc} title={name} />
                <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'center' }}>
                    {images.map((img, idx) => {
                        const m = img.match(/^\/uploads\/(.*?)\/(.*?)\/(.+)$/);
                        const src = m ? `${getApiUrl()}/secure-uploads/${m[1]}/${m[2]}/${m[3]}` : img;
                        return <img key={idx} src={src} alt={name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />;
                    })}
                </Box>
            </Box>
        );
    };
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">
                    Error loading store: {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Store Header */}
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom>
                    Tienda de {seller}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Productos disponibles: {items.length}
                </Typography>
            </Paper>

            {/* Category Filter */}
            {categories.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Filtrar por categoría:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                            label="Todas"
                            onClick={() => setSelectedCategory('')}
                            color={selectedCategory === '' ? 'primary' : 'default'}
                            variant={selectedCategory === '' ? 'filled' : 'outlined'}
                        />
                        {categories.map((category) => (
                            <Chip
                                key={category.id}
                                label={category.name}
                                onClick={() => setSelectedCategory(category.name)}
                                color={selectedCategory === category.name ? 'primary' : 'default'}
                                variant={selectedCategory === category.name ? 'filled' : 'outlined'}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Products Grid */}
            {filteredItems.length === 0 ? (
                <Alert severity="info">
                    No hay productos disponibles en esta tienda.
                </Alert>
            ) : (
                <Grid container spacing={3}>
                    {filteredItems.map((item) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={item.name}>
                            <StyledCard>
                                <ProductImagesCarousel images={item.images} name={item.name} />
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography gutterBottom variant="h6" component="h2">
                                        {item.name}
                                    </Typography>

                                    {item.detalles && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {item.detalles}
                                        </Typography>
                                    )}

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <PriceChip
                                            label={`$${item.price} MN`}
                                            color="primary"
                                            size="medium"
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            Stock: {item.cant}
                                        </Typography>
                                    </Box>

                                    {/* Show availability status */}
                                    <Box sx={{ mt: 2 }}>
                                        {item.cant > 0 ? (
                                            <Chip label="Disponible" color="success" size="small" />
                                        ) : (
                                            <Chip label="Agotado" color="error" size="small" />
                                        )}
                                    </Box>
                                </CardContent>
                            </StyledCard>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Store Footer */}
            <Paper elevation={1} sx={{ p: 2, mt: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Tienda pública de {seller} - Todos los precios en pesos cubanos (MN)
                </Typography>
            </Paper>
        </Container>
    );
}