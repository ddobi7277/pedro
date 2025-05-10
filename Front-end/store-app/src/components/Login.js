
import {useNavigate} from "react-router-dom";


  import * as React from 'react';
  import Box from '@mui/material/Box';
  import Button from '@mui/material/Button';
  import Checkbox from '@mui/material/Checkbox';
  import CssBaseline from '@mui/material/CssBaseline';
  import FormControlLabel from '@mui/material/FormControlLabel';
  import FormLabel from '@mui/material/FormLabel';
  import FormControl from '@mui/material/FormControl';
  import Link from '@mui/material/Link';
  import TextField from '@mui/material/TextField';
  import Typography from '@mui/material/Typography';
  import Stack from '@mui/material/Stack';
  import MuiCard from '@mui/material/Card';
  import { styled } from '@mui/material/styles';

  import AppTheme from './LoginComponents/AppTheme';
  import ColorModeSelect from './LoginComponents/ColorModeSelect';
  
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
  
  const SignInContainer = styled(Stack)(({ theme }) => ({
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
  
  export default function Login(props) {
    const navigate = useNavigate();
    const [usernameError, setUsernameError] = React.useState(false);
    const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
    const [open, setOpen] = React.useState(false);
    const [errorSms, setErrorSms] = React.useState("");
    const [loading, setLoading]= React.useState(false);
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");

  
    const handleClickOpen = () => {
      setOpen(true);
    };
  
    const handleClose = () => {
      setOpen(false);
    };
  
    const handleSubmit = async(event) => {
      event.preventDefault(); // Prevent form submission if validation fails
    if(validateInputs()){    // Rest of your handleSubmit logic...
    const formDetails = new URLSearchParams();
    formDetails.append('username', username);
    formDetails.append('password', password);
    try{
        const response = await fetch(' https://reliably-communal-man.ngrok-free.app/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formDetails.toString(),
    });
    setLoading(false);

    if (response.ok) {
        const token = await response.json();
        localStorage.setItem('token', token.access_token);
        navigate('/Dashboard');
      } else {
        const errorData= await response.json();
        setUsernameErrorMessage(errorData.detail || 'Authentication failed!');
        setPasswordErrorMessage(errorData.detail || 'Authentication failed!');
        setOpen(true);
        setUsernameError(true);
        setPasswordError(true);
 
        console.log(errorSms)
    }
    }catch (error){
        setLoading(false);
        setErrorSms('Authentication failed!');
    }}
        return;
      
    };

    const validateInputs = () => {
      const usernameRegex = /^[a-zA-Z0-9._-]{5,}$/;
      const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_,+{}\[\]:;<>?\/|~]{6,}$/;
    
      let isValid = true;
      if (!usernameRegex.test(username)) {
        setUsernameError(true);
        setUsernameErrorMessage('Username must contain only letters, numbers, underscores, periods, and hyphens.');
        isValid = false;
      } else {
        setUsernameError(false);
        setUsernameErrorMessage('');
      }
    
      if (!passwordRegex.test(password)) {
        setPasswordError(true);
        setPasswordErrorMessage('Password must contain at least 6 characters and can include letters, numbers, and special characters.');
        isValid = false;
      } else {
        setPasswordError(false);
        setPasswordErrorMessage('');
      }
    
      return isValid;
    };
  
    return (
      <AppTheme {...props}>
        <CssBaseline enableColorScheme />
        <SignInContainer direction="column" justifyContent="space-between">
          <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
          <Card variant="outlined">
            
            <Typography
              component="h1"
              variant="h4"
              sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
            >
              Sign in
            </Typography>
            
              <FormControl>
                <FormLabel htmlFor="username">Username/Nombre de Usuario</FormLabel>
                <TextField
                  error={usernameError}
                  helperText={usernameErrorMessage}
                  id="username"
                  type="username"
                  name="username"
                  placeholder="Your username/ Tu usuario"
                  autoComplete="username"
                  autoFocus
                  required
                  fullWidth
                  variant="outlined"
                  color={usernameError ? 'error' : 'primary'}
                  sx={{ ariaLabel: 'username' }}
                  onChange={(e) => {setUsername(e.target.value)}}
                />
              </FormControl>
              <FormControl>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <FormLabel htmlFor="password">Password/Contrasena</FormLabel>
                  <Link
                    component="button"
                    type="button"
                    onClick={handleClickOpen}
                    variant="body2"
                    sx={{ alignSelf: 'baseline' }}
                  >
                  </Link>
                </Box>
                <TextField
                  error={passwordError}
                  helperText={passwordErrorMessage}
                  name="password"
                  placeholder="••••••"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  autoFocus
                  required
                  fullWidth
                  variant="outlined"
                  color={passwordError ? 'error' : 'primary'}
                  onChange={(e) => {setPassword(e.target.value)}}
                />
              </FormControl>
              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                onClick={(e) => {handleSubmit(e)}}
              >
                Sign in
              </Button>
         
           
          </Card>
        </SignInContainer>
      </AppTheme>
    );
  }


/*
  const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorSms, setErrorSms] = useState("");
    const [loading, setLoading]= useState(false);

    const navigate= useNavigate();

    const goHome= () => {
        navigate("/");
    }

    const validateForm= () => {
        if (username.length < 3 || password.length < 3){
            setErrorSms("Username and password must be at least 3 characters");
            return false;
        } 
        if (!username || !password){
            setErrorSms("Username and password are required");
            return false;
        }
        setErrorSms('')
        return true;
    };
      
    const handleSubmit= async (e) => {
        e.preventDefault();
        if(!validateForm()) return;
        setLoading(true);

        const formDetails= new URLSearchParams();
        formDetails.append('username', username);
        formDetails.append('password',password);

        try{
            const response = await fetch('https://localhost:/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formDetails.toString(),
        });
        setLoading(false);

        if (response.ok) {
            const token = await response.json();
            localStorage.setItem('token', token.access_token);
            console.log(token.access_token)
            navigate('/Dashboard', token);
          } else {
            const errorData= await response.json();
            setErrorSms(errorData.detail || 'Authentication failed!');
        }
        }catch (error){
            setLoading(false);
            setErrorSms('Authentication failed!');
        }

    };
*/