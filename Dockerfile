FROM node:14-alpine as nodebuild
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install 
COPY src/ ./src/
COPY tsconfig.json .
RUN npm run build

FROM node:14-alpine as noderun
WORKDIR /app
COPY --from=nodebuild /app/dist/ ./
COPY backend/package*.json ./
RUN npm install --only=prod

EXPOSE 8080
ENV port=8080
ENV PORT=8080
ENV CONFLICT_BEHAVIOR=replace
ENV KEY=
ENV NSID=
ENV OAUTH_TOKEN=
ENV OAUTH_TOKEN_SECRET=
ENV REPOSITORY=
ENV SECRET=
ENTRYPOINT node index.js