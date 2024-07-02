FROM python:3.9

WORKDIR /usr/src/speech-to-text
#COPY . .
# Define the file URL
#ARG FILE_URL=https://alphacephei.com/vosk/models/vosk-model-de-0.21.zip

# Check if the file exists
#RUN if [ ! -f "vosk-model-de-0.21.zip" ]; then \
#        wget "$FILE_URL" && \
#        unzip vosk-model-de-0.21.zip -d ./temp-model && \
#        rm vosk-model-de-0.21.zip; \
#    fi

# Create destination directory
#RUN mkdir -p /models/src/de-de

# Copy contents of temp-model to destination directory
#RUN cp -r ./temp-model/* /models/src/de-de/

# Remove temporary directory
#RUN rm -r ./temp-model

RUN apt-get update && apt-get install -y \
    portaudio19-dev \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 1342
EXPOSE 1338

CMD [ "python", "service/microphone-service.py" ]
