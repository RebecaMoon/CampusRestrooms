
# ==========================================
# Etapa 1: Construir el frontend con Vite
# ==========================================
FROM node:22-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código del frontend
COPY . .

# Generar la versión de producción
RUN npm run build


# ==========================================
# Etapa 2: Servir la aplicación con Nginx
# ==========================================
FROM nginx:alpine

# Copiar los archivos generados por Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto HTTP
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
