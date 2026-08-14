# Gestor de Órdenes de Servicio 📋

Aplicación de escritorio para gestionar órdenes de servicio de reparación de celulares y computadoras.

## Características

✅ Panel lateral con formulario completo  
✅ Vista previa en vivo de la orden  
✅ Generación automática de números de orden  
✅ Almacenamiento local en SQLite  
✅ Generación de PDF profesionales  
✅ Cálculo automático de totales  
✅ Interfaz fluida y responsiva  

## Instalación

### 1. Requisitos previos

- **Node.js** (v14 o superior) - Descarga desde https://nodejs.org
- **npm** (viene con Node.js)

### 2. Instalación de dependencias

```bash
npm install
```

Esto instalará:
- **Electron**: Framework para apps de escritorio
- **pdfkit**: Generador de PDFs
- **better-sqlite3**: Base de datos SQLite

> ⚠️ Si tienes problemas con `better-sqlite3`, necesitarás `build-essential` en Linux:
> ```bash
> sudo apt-get install build-essential python3
> npm install
> ```

### 3. Ejecutar la aplicación

```bash
npm start
```

La app se abrirá automáticamente.

## Estructura de archivos

```
.
├── main.js              # Proceso principal de Electron
├── preload.js          # API segura para comunicación
├── index.html          # Interfaz HTML
├── styles.css          # Estilos CSS
├── app.js              # Lógica JavaScript
├── package.json        # Configuración y dependencias
└── README.md           # Este archivo
```

## Cómo usar

### Crear una nueva orden

1. **Rellenar el formulario** en el panel lateral izquierdo
   - Los campos marcados con * son obligatorios
   - La vista previa se actualiza en tiempo real

2. **Generar número** (opcional)
   - Haz clic en 🔄 para auto-generar un número único

3. **Ver preview en vivo**
   - El área derecha muestra cómo se verá la orden

### Guardar la orden

- Haz clic en **💾 Guardar Orden**
- Se guardará en la base de datos local
- Podrás recuperarla después

### Generar PDF

- Haz clic en **📄 Generar PDF**
- Se creará un archivo PDF profesional
- Se guardará en tu carpeta de **Descargas**
- Puedes enviarlo al cliente

### Limpiar formulario

- Haz clic en **🔄 Limpiar Formulario**
- Todos los campos se vaciarán
- Se generará un nuevo número de orden

## Datos que captura

### Cliente
- Nombre completo
- Teléfono
- Email
- Dirección

### Dispositivo
- Tipo (Celular, Computadora, Tablet, Otro)
- Marca
- Modelo

### Servicio
- Problema reportado
- Trabajo realizado
- Componentes reemplazados
- Observaciones

### Costos
- Mano de obra
- Costo de piezas
- Total automático

## Base de datos

Las órdenes se guardan en: `~/.config/gestor-ordenes-servicio/ordenes.db`

(En Windows: `%APPDATA%/gestor-ordenes-servicio/ordenes.db`)

## Generar instaladores

Para crear ejecutables (.exe, .dmg, .AppImage):

```bash
npm run build
```

Se crearán en la carpeta `dist/`

## Solución de problemas

### La app no abre
```bash
# Limpia e reinstala
rm -rf node_modules
npm install
npm start
```

### Error con better-sqlite3
```bash
# En Linux:
sudo apt-get install build-essential python3
npm rebuild

# En macOS:
xcode-select --install
npm rebuild
```

### PDFs no se generan
- Verifica que tengas permisos de escritura en tu carpeta Descargas
- Intenta generar de nuevo

## Próximas mejoras

- [ ] Editar órdenes existentes
- [ ] Historial de órdenes
- [ ] Envío de PDF por email automático
- [ ] Plantillas personalizables
- [ ] Exportar datos a Excel
- [ ] Versión Android (Kotlin)

## Licencia

MIT - Libre para uso personal y comercial

---

**¿Preguntas o sugerencias?** ¡Dímelo y lo agregamos!
