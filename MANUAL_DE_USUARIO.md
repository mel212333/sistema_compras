# Manual de Usuario — Sistema de Compras

**Versión:** 1.0  
**Fecha:** 23 de junio de 2026

## 1. Objetivo

Este manual explica cómo utilizar el Sistema de Compras desde la creación de un requerimiento hasta la recepción de la mercadería. Las opciones visibles dependen del rol asignado a cada usuario.

## 2. Ingreso y navegación

1. Abra el Sistema de Compras en el navegador.
2. Ingrese su correo electrónico y contraseña.
3. Presione **Ingresar**.

Al iniciar sesión verá:

- **Inicio:** resumen de requerimientos y accesos rápidos.
- **Menú lateral:** módulos habilitados para su rol. Puede contraerlo o expandirlo con el botón superior.
- **Perfil:** nombre, correo, rol, sector e ID de usuario.
- **Salir:** cierra la sesión. Úselo especialmente en equipos compartidos.

Si las credenciales no funcionan, verifique el correo y la contraseña. Si el problema continúa, solicite al administrador que confirme que su usuario esté activo.

## 3. Roles y accesos

| Rol | Función principal |
|---|---|
| Administrador | Acceso general, aprobaciones y administración de usuarios. |
| Solicitante | Crear, enviar y consultar sus requerimientos. |
| Jefe de sector | Revisar requerimientos de su sector y realizar la aprobación N1. |
| Aprobador segunda firma | Revisar y realizar la aprobación N2. |
| Compras | Cargar cotizaciones, comparar ofertas, adjudicar y asignar OC. |
| Depósito | Registrar la recepción y calificar proveedores. |

## 4. Estados del requerimiento

| Estado | Significado |
|---|---|
| Borrador | La solicitud todavía puede revisarse antes de enviarla. |
| Pendiente aprobación N1 | Espera la decisión del jefe de sector. |
| Pendiente aprobación N2 | Superó N1 y espera la segunda firma. |
| Aprobado | Está disponible para que Compras solicite o cargue cotizaciones. |
| Rechazado | Fue rechazado durante la aprobación. Consulte el motivo. |
| Cotizado | Tiene ofertas de proveedores cargadas. |
| Listo para OC | Los ítems fueron adjudicados. |
| Finalizado | Tiene uno o más códigos de orden de compra asignados. |

Flujo normal: **Borrador → Aprobación N1 → Aprobación N2 → Aprobado → Cotizado → Listo para OC → Finalizado**.

## 5. Consultar requerimientos

1. Ingrese a **Requerimientos**.
2. Use los filtros o la búsqueda para localizar una solicitud.
3. Abra el requerimiento para ver sus datos, ítems, estado e historial.
4. Las acciones disponibles aparecerán según el estado y su rol.

## 6. Crear un requerimiento

Disponible para **Solicitante** y **Administrador**.

1. Ingrese a **Requerimientos** y seleccione **Nuevo requerimiento**.
2. Elija el tipo:
   - **Normal:** sigue el circuito de dos aprobaciones.
   - **Express:** se utiliza para una compra urgente; requiere justificación y documentación adjunta, y pasa directamente a Compras.
3. Complete los datos generales solicitados, como sector, centro de costo, planta o lugar de entrega.
4. Agregue los productos o servicios. Indique descripción, cantidad y demás datos requeridos para cada ítem.
5. Revise la información y presione **Guardar requerimiento**.
6. En una solicitud normal guardada como borrador, presione **Enviar** para iniciar la aprobación.

Antes de enviar, compruebe cantidades, especificaciones y destino. Una descripción clara ayuda a que los proveedores coticen el mismo producto o servicio.

## 7. Aprobar o rechazar

### Aprobación N1

Disponible para el **Jefe de sector** correspondiente y el **Administrador**.

1. Abra **Requerimientos** y localice los pendientes de aprobación N1.
2. Revise solicitante, sector, centro de costo e ítems.
3. Seleccione **Aprobar N1** para continuar o **Rechazar** si requiere corrección.

### Aprobación N2

Disponible según los permisos configurados en el sistema.

1. Abra un requerimiento en estado pendiente de aprobación N2.
2. Revise toda la solicitud.
3. Seleccione **Aprobar N2** o **Rechazar**.

El sistema impide que un aprobador autorice su propia solicitud, salvo las excepciones administrativas configuradas. N1 sólo puede aprobar solicitudes de su sector.

## 8. Gestión de Compras

Disponible para **Compras** y **Administrador**.

### 8.1 Abrir la bandeja

1. Ingrese a **Compras**.
2. Busque el requerimiento aprobado.
3. Abra **Cotizaciones** para gestionar las ofertas.

### 8.2 Cargar una cotización

1. Seleccione o busque el proveedor por CUIT, razón social, dirección, teléfono o correo.
2. Complete **Moneda**, **Forma de pago**, **Plazo de entrega** y **Lugar de entrega**.
3. Si la moneda lo requiere, revise la **Cotización USD**.
4. Adjunte el archivo recibido en PDF o imagen.
5. Cargue el precio unitario de cada ítem y, si corresponde, las observaciones.
6. Guarde la cotización.
7. Repita el proceso para cada proveedor.

### 8.3 Comparar y adjudicar

1. Abra la **Comparativa** del requerimiento.
2. Compare precio, moneda, forma de pago, entrega y archivo respaldatorio.
3. Seleccione un proveedor para cada producto. Puede adjudicar distintos ítems a distintos proveedores.
4. Presione **Guardar adjudicación**.

El menor precio resaltado es una ayuda visual; la decisión también puede considerar calidad, plazo, antecedentes y condiciones comerciales.

### 8.4 Asignar orden de compra

1. Cuando todos los ítems estén adjudicados, seleccione **Asignar OC**.
2. Ingrese uno o más **Códigos de OC**. Use **Agregar código** cuando haya varias órdenes.
3. Presione **Guardar códigos**.
4. Verifique que el requerimiento figure como finalizado o con OC asignada.

## 9. Recepción en Depósito

Disponible para **Depósito** y **Administrador**.

1. Ingrese a **Depósito**.
2. Busque por número de requerimiento, ID o número de OC.
3. Abra el registro y seleccione el estado de recepción:
   - **Pendiente:** todavía no fue recibido.
   - **Parcial:** llegó sólo una parte.
   - **Recibido:** la recepción quedó completa.
4. Complete la fecha estimada o real.
5. Agregue una observación, por ejemplo mercadería faltante, remito pendiente o diferencias detectadas.
6. Guarde el seguimiento.

Al marcar **Recibido**, se abre la calificación del proveedor. Evalúe la calificación general, precio, rapidez y calidad; agregue una observación si es útil y presione **Guardar calificación**.

## 10. Calificaciones de proveedores

El módulo **Calificaciones** está disponible para Administrador, Compras y Depósito. Permite:

- consultar el promedio de cada proveedor;
- filtrar por proveedor;
- revisar las calificaciones registradas y sus observaciones.

## 11. Administración de usuarios

Disponible sólo para **Administrador**.

### Crear un usuario

1. Ingrese a **Usuarios**.
2. Complete **Nombre**, **Email**, **Rol**, **Sector** y **Contraseña**.
3. Presione **Crear usuario**.

### Editar, dar de baja o reactivar

1. Localice al usuario en la lista.
2. Use **Editar** para modificar sus datos. La nueva contraseña puede dejarse vacía para conservar la actual.
3. Use **Baja** para impedir el acceso sin borrar el registro.
4. Use **Reactivar** para devolverle el acceso.

Asigne el rol y sector con cuidado: ambos determinan qué información y acciones tendrá disponibles el usuario.

## 12. Problemas frecuentes

| Problema | Qué hacer |
|---|---|
| No puedo ingresar | Verifique correo y contraseña; solicite al administrador que confirme que el usuario esté activo. |
| No veo un menú o botón | La opción puede no corresponder a su rol o al estado actual del requerimiento. |
| No puedo aprobar | Compruebe el nivel pendiente, el sector y que la solicitud no sea propia. |
| No puedo asignar una OC | Confirme que existan cotizaciones y que todos los ítems estén adjudicados. |
| No aparece en Depósito | El requerimiento debe tener una OC asignada. |
| Un archivo no carga | Verifique el formato admitido, el tamaño y la conexión; vuelva a intentarlo. |
| La información no se actualiza | Presione **Actualizar** o recargue la página. Evite repetir una acción mientras el sistema indique que está guardando. |

Si el error continúa, informe al administrador: usuario, número de requerimiento, acción realizada, mensaje mostrado y una captura de pantalla.

## 13. Buenas prácticas

- No comparta su contraseña.
- Cierre la sesión al terminar.
- Evite datos ambiguos en las descripciones de los ítems.
- Adjunte siempre la documentación que respalda cotizaciones y compras express.
- Verifique los códigos de OC antes de guardarlos.
- Registre recepciones parciales y diferencias en observaciones.

---

Este documento describe la versión actual del sistema. Los nombres y opciones pueden cambiar en futuras actualizaciones.
