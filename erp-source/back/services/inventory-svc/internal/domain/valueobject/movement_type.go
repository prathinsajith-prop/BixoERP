package valueobject

type MovementType string

const (
	MovementReceive  MovementType = "RECEIVE"
	MovementIssue    MovementType = "ISSUE"
	MovementTransfer MovementType = "TRANSFER"
	MovementAdjust   MovementType = "ADJUST"
)

func (m MovementType) IsValid() bool {
	switch m {
	case MovementReceive, MovementIssue, MovementTransfer, MovementAdjust:
		return true
	}
	return false
}

func (m MovementType) String() string {
	return string(m)
}
