package ee.myygi.radar.ui.locations

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ee.myygi.radar.domain.model.Location
import ee.myygi.radar.domain.model.LocationIssueType

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportLocationIssueBottomSheet(
    location: Location,
    onDismiss: () -> Unit,
    onSubmitIssue: (issueType: LocationIssueType, description: String) -> Unit
) {
    var selectedIssueType by remember { mutableStateOf(LocationIssueType.DOES_NOT_EXIST) }
    var description by remember { mutableStateOf("") }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Teata veast: ${location.name}",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = "Täname tähelepaneku eest! Moderaator vaatab teate läbi ja korrigeerib kaardiinfot.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "Vali vea tüüp:",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold
                )

                LocationIssueType.values().forEach { type ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedIssueType == type,
                            onClick = { selectedIssueType = type }
                        )
                        Text(
                            text = type.displayName,
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.padding(start = 4.dp)
                        )
                    }
                }
            }

            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Täpsustav selgitus (vabatahtlik)") },
                placeholder = { Text("Kirjelda lühidalt probleemi...") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3
            )

            Button(
                onClick = {
                    onSubmitIssue(selectedIssueType, description)
                    onDismiss()
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Saada veateade moderaatorile")
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
