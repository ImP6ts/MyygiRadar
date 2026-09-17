package ee.myygi.radar.ui.locations

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ee.myygi.radar.domain.model.Location
import ee.myygi.radar.domain.model.LocationStatus
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun UserSubmissionsScreen(
    submissions: List<Location>,
    onAddNewLocation: () -> Unit,
    modifier: Modifier = Modifier
) {
    val dateFormat = remember { SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.getDefault()) }

    Column(modifier = modifier.fillMaxSize().padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Minu lisatud kohad",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Esitatud kinnitamiseks",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Button(onClick = onAddNewLocation) {
                Text("Lisa uus")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (submissions.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Sa pole veel ühtegi uut asukohta lisanud.")
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedButton(onClick = onAddNewLocation) {
                        Text("Lisa pood või ostukeskus")
                    }
                }
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(submissions, key = { it.id }) { loc ->
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = loc.name,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )

                                when (loc.status) {
                                    LocationStatus.PENDING -> {
                                        Badge(containerColor = MaterialTheme.colorScheme.secondaryContainer) {
                                            Text("OOTEL", color = MaterialTheme.colorScheme.onSecondaryContainer)
                                        }
                                    }
                                    LocationStatus.APPROVED -> {
                                        Badge(containerColor = MaterialTheme.colorScheme.primaryContainer) {
                                            Text("KINNITATUD", color = MaterialTheme.colorScheme.onPrimaryContainer)
                                        }
                                    }
                                    LocationStatus.REJECTED -> {
                                        Badge(containerColor = MaterialTheme.colorScheme.errorContainer) {
                                            Text("TAGASI LÜKATUD", color = MaterialTheme.colorScheme.onErrorContainer)
                                        }
                                    }
                                }
                            }

                            Text(
                                text = "${loc.address}, ${loc.city}",
                                style = MaterialTheme.typography.bodyMedium
                            )

                            loc.submittedAt?.let { time ->
                                Text(
                                    text = "Esitatud: ${dateFormat.format(Date(time))}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
