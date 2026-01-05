FROM node:20-alpine AS base

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY server.js ./

EXPOSE 5001

# Environment defaults (override at run time)
ENV PORT=5001 \
    SMTP_HOST=smtp.gmail.com \
    SMTP_PORT=587 \
    SMTP_SECURE=false

CMD ["node", "server.js"]

