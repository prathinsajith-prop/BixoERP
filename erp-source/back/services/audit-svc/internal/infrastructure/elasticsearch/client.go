package elasticsearch

import (
	"crypto/tls"
	"fmt"
	"net/http"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/erp/audit-svc/internal/infrastructure/config"
)

// NewClient creates and returns a configured Elasticsearch client.
func NewClient(cfg *config.Config) (*elasticsearch.Client, error) {
	esCfg := elasticsearch.Config{
		Addresses: []string{cfg.ElasticsearchURL},
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				MinVersion: tls.VersionTLS12,
			},
		},
	}

	if cfg.ElasticsearchUsername != "" {
		esCfg.Username = cfg.ElasticsearchUsername
		esCfg.Password = cfg.ElasticsearchPassword
	}

	client, err := elasticsearch.NewClient(esCfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create elasticsearch client: %w", err)
	}

	// Ping to verify connection
	res, err := client.Ping()
	if err != nil {
		return nil, fmt.Errorf("elasticsearch ping failed: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		return nil, fmt.Errorf("elasticsearch ping returned error: %s", res.Status())
	}

	return client, nil
}
