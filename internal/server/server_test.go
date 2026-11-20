package server

import (
	"archive/zip"
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"lunarreg/internal/store"
	"lunarreg/web"
)

func setup(t *testing.T) (*httptest.Server, *http.Client) {
	t.Helper()
	st, err := store.Open(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	srv := New(st, web.FS, ctx)
	ts := httptest.NewServer(srv.Handler())
	t.Cleanup(func() { cancel(); ts.Close() })
	jar, _ := cookiejar.New(nil)
	return ts, &http.Client{Jar: jar, Timeout: 90 * time.Second}
}

func postSample(t *testing.T, c *http.Client, base, sample, params string) string {
	t.Helper()
	var b bytes.Buffer
	mw := multipart.NewWriter(&b)
	mw.WriteField("sample", sample)
	if params != "" {
		mw.WriteField("params", params)
	}
	mw.Close()
	resp, err := c.Post(base+"/api/jobs", mw.FormDataContentType(), &b)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	var out map[string]string
	json.NewDecoder(resp.Body).Decode(&out)
	if resp.StatusCode != 202 || out["id"] == "" {
		t.Fatalf("create failed: %d %v", resp.StatusCode, out)
	}
	return out["id"]
}

func waitDone(t *testing.T, c *http.Client, base, id string) map[string]any {
	t.Helper()
	resp, err := c.Get(base + "/api/jobs/" + id + "/events")
	if err != nil {
		t.Fatal(err)
	}
	sc := bufio.NewScanner(resp.Body)
	sawProgress := false
	for sc.Scan() {
		if strings.Contains(sc.Text(), `"type":"progress"`) {
			sawProgress = true
		}
		if strings.Contains(sc.Text(), `"type":"done"`) {
			break
		}
	}
	resp.Body.Close()
	if !sawProgress {
		t.Error("no progress events received over SSE")
	}
	r2, err := c.Get(base + "/api/jobs/" + id)
	if err != nil {
		t.Fatal(err)
	}
	defer r2.Body.Close()
	var j map[string]any
	json.NewDecoder(r2.Body).Decode(&j)
	return j
}

func TestLiveWorkflow(t *testing.T) {
	ts, c := setup(t)
	id := postSample(t, c, ts.URL, "ohrc-crater-field", "")
	j := waitDone(t, c, ts.URL, id)
	if j["status"] != "completed" {
		t.Fatalf("status = %v error=%v", j["status"], j["error"])
	}
	if te, ok := j["truthError"].(float64); !ok || te > 2 {
		t.Errorf("truth error = %v", j["truthError"])
	}
	for _, k := range []string{"registered", "overlay", "difference", "checker", "matches", "source", "reference", "before"} {
		r, _ := c.Get(ts.URL + "/api/jobs/" + id + "/image/" + k)
		b, _ := io.ReadAll(r.Body)
		r.Body.Close()
		if r.StatusCode != 200 || !bytes.HasPrefix(b, []byte("\x89PNG")) {
			t.Errorf("image %s: status %d", k, r.StatusCode)
		}
	}
	r, _ := c.Get(ts.URL + "/api/jobs/" + id + "/export.zip")
	zb, _ := io.ReadAll(r.Body)
	r.Body.Close()
	zr, err := zip.NewReader(bytes.NewReader(zb), int64(len(zb)))
	if err != nil || len(zr.File) < 10 {
		t.Fatalf("bad zip: %v files=%d", err, len(zr.File))
	}
	r, _ = c.Get(ts.URL + "/api/jobs/" + id + "/correspondences.csv")
	cb, _ := io.ReadAll(r.Body)
	r.Body.Close()
	if !strings.HasPrefix(string(cb), "index,source_x") {
		t.Error("csv header missing")
	}
	// stats reflect the run
	r, _ = c.Get(ts.URL + "/api/stats")
	var st map[string]any
	json.NewDecoder(r.Body).Decode(&st)
	r.Body.Close()
	if st["completed"].(float64) != 1 || st["meanRMSE"] == nil {
		t.Errorf("stats = %v", st)
	}
	// another visitor must not see this job
	other := &http.Client{}
	r, _ = other.Get(ts.URL + "/api/jobs/" + id)
	r.Body.Close()
	if r.StatusCode != 404 {
		t.Errorf("owner isolation broken: %d", r.StatusCode)
	}
	// rerun with a different model, then delete both
	rr, _ := c.Post(ts.URL+"/api/jobs/"+id+"/rerun", "application/json", strings.NewReader(`{"model":"affine"}`))
	var nj map[string]string
	json.NewDecoder(rr.Body).Decode(&nj)
	rr.Body.Close()
	j2 := waitDone(t, c, ts.URL, nj["id"])
	if j2["status"] != "completed" || j2["result"].(map[string]any)["modelUsed"] != "affine" {
		t.Errorf("rerun result: %v", j2["status"])
	}
	for _, d := range []string{id, nj["id"]} {
		req, _ := http.NewRequest("DELETE", ts.URL+"/api/jobs/"+d, nil)
		dr, _ := c.Do(req)
		dr.Body.Close()
		if dr.StatusCode != 200 {
			t.Errorf("delete %d", dr.StatusCode)
		}
	}
}

func TestValidationAndUploads(t *testing.T) {
	ts, c := setup(t)
	var b bytes.Buffer
	mw := multipart.NewWriter(&b)
	mw.WriteField("sample", "ohrc-crater-field")
	mw.WriteField("params", `{"features": 5}`)
	mw.Close()
	r, _ := c.Post(ts.URL+"/api/jobs", mw.FormDataContentType(), &b)
	r.Body.Close()
	if r.StatusCode != 400 {
		t.Errorf("bad params should be 400, got %d", r.StatusCode)
	}
	// garbage upload is rejected with 422, not accepted then failed
	b.Reset()
	mw = multipart.NewWriter(&b)
	for _, f := range []string{"source", "reference"} {
		fw, _ := mw.CreateFormFile(f, f+".png")
		fw.Write([]byte("this is not an image at all"))
	}
	mw.Close()
	r, _ = c.Post(ts.URL+"/api/jobs", mw.FormDataContentType(), &b)
	r.Body.Close()
	if r.StatusCode != 422 {
		t.Errorf("garbage upload should be 422, got %d", r.StatusCode)
	}
	r, _ = c.Get(ts.URL + "/api/samples")
	var s []map[string]any
	json.NewDecoder(r.Body).Decode(&s)
	r.Body.Close()
	if len(s) != 5 {
		t.Errorf("samples = %d", len(s))
	}
}

func TestReadUploadRejectsOversizedStream(t *testing.T) {
	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	fw, err := mw.CreateFormFile("source", "oversized.png")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := fw.Write(bytes.Repeat([]byte("x"), maxUpload+1)); err != nil {
		t.Fatal(err)
	}
	if err := mw.Close(); err != nil {
		t.Fatal(err)
	}
	r := httptest.NewRequest(http.MethodPost, "/", &body)
	r.Header.Set("Content-Type", mw.FormDataContentType())
	if err := r.ParseMultipartForm(8 << 20); err != nil {
		t.Fatal(err)
	}
	defer r.MultipartForm.RemoveAll()
	if _, _, err := readUpload(r, "source"); err == nil {
		t.Fatal("expected oversized upload to be rejected")
	}
}
