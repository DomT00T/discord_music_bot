# Set the base image
FROM node:18.16

# Set the working directory in the Docker image
WORKDIR /app

# Copy the current directory contents into the Docker image
COPY . .

# Install app dependencies
RUN npm install

# Start the app
RUN npm run build

# Expose port 3000 to the outside
EXPOSE 3000

# Define the command to run your app using CMD which keeps the container running.
CMD [ "npm", "start" ]
