// Package web embeds the compiled single-page UI into the Go binary.
package web

import "embed"

// FS holds index.html, css and js assets.
//
//go:embed index.html
var FS embed.FS
