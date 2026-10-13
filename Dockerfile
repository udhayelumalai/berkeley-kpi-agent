FROM python:3.9-slim
WORKDIR /app
COPY . /app
EXPOSE 8088
CMD ["python3", "server.py"]
