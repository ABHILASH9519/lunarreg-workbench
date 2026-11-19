# syntax=docker/dockerfile:1
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/lunarreg ./cmd/lunarreg

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/lunarreg /lunarreg
ENV LUNARREG_ADDR=:8080 LUNARREG_DATA=/data
VOLUME /data
EXPOSE 8080
USER nonroot
ENTRYPOINT ["/lunarreg"]
