# syntax=docker/dockerfile:1
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/lunarreg ./cmd/lunarreg
# Prepare the writable data directory for the distroless nonroot user (UID 65532).
RUN mkdir -p /out/data && chown 65532:65532 /out/data

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/lunarreg /lunarreg
COPY --from=build --chown=65532:65532 /out/data /data
ENV LUNARREG_ADDR=:8080 LUNARREG_DATA=/data
VOLUME /data
EXPOSE 8080
USER nonroot
ENTRYPOINT ["/lunarreg"]
