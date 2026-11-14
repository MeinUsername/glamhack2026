package app

import (
	"strings"
	"testing"
)

// AC-020-5: kept and new images together may not exceed the limit.
func TestAC020_5_CheckImageCount(t *testing.T) {
	if err := checkImageCount(4, 1); err != nil {
		t.Errorf("4+1: %v", err)
	}
	if err := checkImageCount(0, 5); err != nil {
		t.Errorf("0+5: %v", err)
	}
	err := checkImageCount(5, 1)
	if err == nil || !strings.Contains(err.Error(), "5 stay, you can add 0 more") {
		t.Errorf("5+1: %v", err)
	}
	if err := checkImageCount(3, 3); err == nil {
		t.Error("3+3 accepted")
	}
}
