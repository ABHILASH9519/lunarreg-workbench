package server

import (
	"bufio"
	"net/http"
	"strings"
	"testing"
)

func TestEventsForCompletedJobReturnImmediately(t *testing.T) {
	ts, c := setup(t)
	id := postSample(t, c, ts.URL, "ohrc-crater-field", "")
	job := waitDone(t, c, ts.URL, id)
	if job["status"] != "completed" {
		t.Fatalf("job status = %v, want completed", job["status"])
	}

	resp, err := c.Get(ts.URL + "/api/jobs/" + id + "/events")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("SSE status = %d, want 200", resp.StatusCode)
	}
	sc := bufio.NewScanner(resp.Body)
	var payload strings.Builder
	for sc.Scan() {
		payload.WriteString(sc.Text())
		if strings.Contains(sc.Text(), `"type":"done"`) {
			break
		}
	}
	if err := sc.Err(); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(payload.String(), `"type":"done"`) {
		t.Fatalf("completed job did not emit terminal SSE event: %q", payload.String())
	}
}
