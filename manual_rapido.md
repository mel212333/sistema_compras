# Manual de Uso Rápido - Sistema de Compras en Red Local

Este manual explica cómo levantar el sistema (Backend, Frontend y Base de datos) y acceder desde cualquier dispositivo de tu red local.

---

## 📋 Requisitos Previos

Antes de iniciar, asegúrate de que:
1. **Node.js** esté instalado en tu computadora.
2. El servicio de **PostgreSQL** esté iniciado y corriendo en el puerto `5432` con el usuario `postgres` y la contraseña `postgres`.

---

## 🚀 Cómo Iniciar el Sistema (Con 1 Clic)

Hemos creado un script automatizado llamado **`iniciar_sistema.bat`** en la carpeta principal (`Sistemas Compras`).

1. Hacé doble clic sobre **`iniciar_sistema.bat`**.
2. El script realizará las siguientes tareas de forma automática:
   * **Detectará tu dirección IP local** actual de red (por ejemplo, `10.0.0.109` o `10.0.0.118`).
   * **Actualizará las configuraciones** `.env` del Frontend y Backend con esa dirección IP (para que no falle si tu router cambia de IP al día siguiente).
   * **Iniciará el Backend** en una ventana de consola independiente.
   * **Iniciará el Frontend** en otra ventana de consola independiente.
3. Dejá las ventanas abiertas mientras uses el sistema.

---

## 💻 Cómo Acceder a la Aplicación

### Desde la computadora principal (donde corren los servidores):
* En tu navegador entrá a: **`http://localhost:5173`**

### Desde otras computadoras o celulares en la misma red local:
* Abrí el navegador del dispositivo y entrá a la dirección de red que te muestra el script en pantalla, por ejemplo:
  **`http://10.0.0.109:5173`** o **`http://10.0.0.118:5173`**

*(Nota: Todos los dispositivos deben estar conectados al mismo Wi-Fi o red local).*

---

## 📂 Cómo Migrar/Correr el Sistema en otra Computadora (Ej: IP 10.0.0.118)

Si querés mover el sistema completo a otra PC de tu oficina o casa que tiene la IP `10.0.0.118`, seguí estos pasos en esa nueva PC:

1. **Copiar los archivos**:
   Copia la carpeta completa **`Sistemas Compras`** (que contiene el backend, frontend y los scripts) a la nueva computadora.

2. **Instalar programas requeridos**:
   Instala **Node.js** y **PostgreSQL** en esa nueva máquina.

3. **Restaurar la Base de Datos**:
   * Asegúrate de que el archivo `compras_nueva.sql` esté en la carpeta principal de la nueva PC.
   * Ejecutá el archivo `importar_db.bat` en esa PC para crear la base de datos `compras` e importar los datos (si no recuerdas la contraseña de Postgres en la nueva PC, podés usar el truco de cambiar la autenticación a `trust` en `pg_hba.conf` como hicimos hoy).

4. **Levantar el sistema**:
   * Hacé doble clic en **`iniciar_sistema.bat`** en la nueva PC.
   * El script detectará automáticamente que la IP de la nueva PC es `10.0.0.118`, actualizará los archivos de configuración `.env` de forma automática, y levantará los servidores en red local bajo la IP `10.0.0.118`.

---

## 🛠️ Solución de Problemas Frecuentes

### 1. Otras máquinas no pueden ingresar (Queda cargando / da error de conexión)
Esto suele deberse al **Cortafuegos (Firewall) de Windows** en tu PC principal, que bloquea las conexiones entrantes.
* **Solución**: 
  1. Buscá "Firewall de Windows Defender" en el menú Inicio.
  2. Hacé clic en "Configuración avanzada".
  3. En "Reglas de entrada", creá una nueva regla de tipo **Puerto**.
  4. Seleccioná **TCP** y especificá los puertos **`4000, 5173`**.
  5. Elegí "Permitir la conexión" y aplicá la regla para todos los perfiles (Dominio, Privada, Pública).

### 2. Error al conectar a la base de datos en el backend
Si la ventana del backend muestra un error de conexión a la base de datos:
* **Solución**: Asegúrate de que el servicio de PostgreSQL esté activo. Podés presionar `Win + R`, escribir `services.msc`, buscar `postgresql-x64-18` y darle a **Iniciar** o **Reiniciar**.
