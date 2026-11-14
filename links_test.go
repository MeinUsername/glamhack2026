package app

import (
	"strings"
	"testing"
)

func TestCheckLinkURL(t *testing.T) {
	good := []string{"https://example.org", "HTTP://example.org/a?b=c", "https://a.b/c#d"}
	bad := []string{"", "ftp://x.org", "javascript:alert(1)", "https://", "https://a b.org", "example.org", "https://x.org/" + strings.Repeat("a", maxLinkURLChars)}
	for _, u := range good {
		if err := checkLinkURL(u); err != nil {
			t.Errorf("%q rejected: %v", u, err)
		}
	}
	for _, u := range bad {
		if err := checkLinkURL(u); err == nil {
			t.Errorf("%q accepted", u)
		}
	}
}

func TestCheckLinks(t *testing.T) {
	in := []linkInput{{URL: " https://a.org ", Title: " A ", TypeID: "tools"}, {URL: "https://b.org", TypeID: "tools"}}
	got, err := checkLinks(in)
	if err != nil || len(got) != 2 || got[0].URL != "https://a.org" || got[0].Title != "A" {
		t.Fatalf("got %v, %v", got, err)
	}
	if ids := linkTypeIDsOf(got); len(ids) != 1 || ids[0] != "tools" {
		t.Errorf("ids = %v", ids)
	}
	if _, err := checkLinks([]linkInput{{URL: "https://a.org"}}); err == nil {
		t.Error("link without type accepted")
	}
	many := make([]linkInput, maxLinksPerIdea+1)
	for i := range many {
		many[i] = linkInput{URL: "https://a.org", TypeID: "t"}
	}
	if _, err := checkLinks(many); err == nil {
		t.Error("21 links accepted")
	}
	if _, err := checkLinks(many[:maxLinksPerIdea]); err != nil {
		t.Errorf("20 links rejected: %v", err)
	}
}

func TestLinkTypeNameAndSort(t *testing.T) {
	if _, err := checkLinkTypeName(" ", nil); err == nil {
		t.Error("blank accepted")
	}
	if _, err := checkLinkTypeName("tools", []string{"Tools"}); err == nil {
		t.Error("duplicate accepted")
	}
	list := []linkTypeView{{"1", "tools"}, {"2", "Reference"}, {"3", "Institutes"}}
	sortLinkTypes(list)
	if list[0].Name != "Institutes" || list[1].Name != "Reference" || list[2].Name != "tools" {
		t.Errorf("order %v", list)
	}
}
