// Command lunarreg runs the LunarReg Workbench server.
package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"lunarreg/internal/server"
	"lunarreg/internal/store"
	"lunarreg/web"
)

func main() {
	addr := flag.String("addr", envOr("LUNARREG_ADDR", ":8080"), "listen address")
	data := flag.String("data", envOr("LUNARREG_DATA", "data"), "data directory")
	flag.Parse()

	st, err := store.Open(*data)
	if err != nil {
		log.Fatalf("open store: %v", err)
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	srv := server.New(st, web.FS, ctx)
	hs := &http.Server{Addr: *addr, Handler: srv.Handler(), ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout: 2 * time.Minute, IdleTimeout: 2 * time.Minute}
	go func() {
		<-ctx.Done()
		sc, c := context.WithTimeout(context.Background(), 10*time.Second)
		defer c()
		_ = hs.Shutdown(sc)
	}()
	log.Printf("LunarReg Workbench %s listening on %s (data: %s)", server.Version, *addr, *data)
	if err := hs.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
	srv.Wait()
}

func envOr(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
