# Experimental build only. Does not deploy or modify existing FMHY services.
FROM golang:1.26-alpine AS builder
RUN apk add --no-cache git build-base
WORKDIR /work
RUN git clone --depth=1 https://github.com/MADPANDA3D/pandaflix.git /work/pandaflix
COPY experiments/cinejoy-bridge/main.go /work/pandaflix/cmd/cinejoy-bridge/main.go
WORKDIR /work/pandaflix
RUN go build -o /tmp/cinejoy-bridge ./cmd/cinejoy-bridge

FROM alpine:3.22
RUN apk add --no-cache ca-certificates
COPY --from=builder /tmp/cinejoy-bridge /usr/local/bin/cinejoy-bridge
EXPOSE 8788
CMD ["/usr/local/bin/cinejoy-bridge"]
