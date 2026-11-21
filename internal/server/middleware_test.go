package server

import (
	"net/http"
	"testing"
)

func TestVisitorCookieUsesSecureAttributesBehindHTTPSProxy(t *testing.T) {
	ts, c := setup(t)
	req, err := http.NewRequest(http.MethodGet, ts.URL+"/api/health", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("X-Forwarded-Proto", "https")
	resp, err := c.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	var visitor *http.Cookie
	for _, cookie := range resp.Cookies() {
		if cookie.Name == "lr_uid" {
			visitor = cookie
			break
		}
	}
	if visitor == nil {
		t.Fatal("visitor cookie was not set")
	}
	if !visitor.Secure || !visitor.HttpOnly || visitor.SameSite != http.SameSiteLaxMode {
		t.Fatalf("visitor cookie security attributes = secure:%v httponly:%v samesite:%v", visitor.Secure, visitor.HttpOnly, visitor.SameSite)
	}
}
