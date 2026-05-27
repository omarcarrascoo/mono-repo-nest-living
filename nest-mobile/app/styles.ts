import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '@/constants/theme'; 

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ui.white,
  },
  
  // --- FONDO ---
  fixedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },

  // --- BOTTOM SHEET (Más limpio) ---
  bottomSheet: {
    backgroundColor: COLORS.ui.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 32, // Más margen lateral para aire
    paddingTop: 48,
    paddingBottom: 40,
    minHeight: height * 0.65,
    // Sombra muy difusa y suave (casi invisible)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05, 
    shadowRadius: 15,
    elevation: 5,
  },

  // --- HEADER ---
  headerSection: {
    marginBottom: 36,
  },
  title: {
    fontSize: 30, // Un poco más pequeño que antes, más elegante
    fontWeight: '700',
    color: COLORS.light.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.light.textSecondary,
    fontWeight: '400',
  },

  // --- FORMULARIO ---
  formContainer: {
    gap: 24, // Mayor separación entre inputs
  },

  // INPUTS MINIMALISTAS
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // Fondo muy sutil (Gris Slate 50)
    backgroundColor: '#F8FAFC', 
    height: 56, // Altura estándar cómoda
    borderRadius: 16, // Curva suave
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0', // Borde gris muy claro por defecto
  },
  inputContainerActive: {
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.brand.teal, // Solo cambia el color del borde
    // Sin sombra pesada, solo el borde indica foco
  },
  
  inputIcon: {
    marginRight: 14,
    // El icono ya no tiene fondo, flota libremente
  },

  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.light.textPrimary,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
  },

  // --- OPCIONES ---
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.light.textSecondary,
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 14,
    color: COLORS.light.textSecondary, // Gris en lugar de Teal para distraer menos
    fontWeight: '600',
  },

  // --- BOTÓN ---
  buttonContainer: {
    marginTop: 16,
    borderRadius: 16,
    // Sombra reducida drásticamente
    shadowColor: COLORS.brand.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGradient: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16, // Texto un poco más discreto
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // --- FOOTER ---
  footer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.light.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.brand.teal,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
});