FROM golang:latest
WORKDIR /app
COPY . .
RUN go build -o mem-monitor .
CMD ["./mem-monitor"]
