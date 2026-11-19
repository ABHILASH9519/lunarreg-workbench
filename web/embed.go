// Package web embeds the single-page UI into the Go binary.
package web

import "embed"

// FS holds index.html, app.css, app.js, favicon and fonts.
//
//go:embed index.html app.css app.js favicon.svg fonts
var FS embed.FS
