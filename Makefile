.PHONY: build run test test-race coverage bench docker clean
build:
	go build -trimpath -o bin/lunarreg ./cmd/lunarreg
run: build
	./bin/lunarreg -addr :8080 -data ./data
test: build
	go vet ./... && go test ./... && python3 -m unittest discover -s tests -v
test-race:
	go test -race ./...
coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -func=coverage.out
bench:  ## needs a running server (make run)
	python3 tools/benchmark.py --url http://localhost:8080 --out data/benchmark.json
docker:
	docker build -t lunarreg-workbench .
clean:
	rm -rf bin data
