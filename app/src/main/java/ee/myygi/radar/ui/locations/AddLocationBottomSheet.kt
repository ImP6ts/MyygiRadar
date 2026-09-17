package ee.myygi.radar.ui.locations

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ee.myygi.radar.domain.model.Location
import ee.myygi.radar.domain.model.LocationType

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddLocationBottomSheet(
    initialLat: Double,
    initialLng: Double,
    onDismiss: () -> Unit,
    onCheckDuplicate: (name: String, address: String, lat: Double, lng: Double) -> Location?,
    onSubmit: (name: String, address: String, city: String, type: String, lat: Double, lng: Double) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("Tallinn") }
    var selectedType by remember { mutableStateOf(LocationType.SHOPPING_CENTRE) }
    var lat by remember { mutableStateOf(initialLat) }
    var lng by remember { mutableStateOf(initialLng) }

    var duplicateWarning by remember { mutableStateOf<Location?>(null) }
    var isReviewStep by remember { mutableStateOf(false) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = if (isReviewStep) "Kinnita asukoha andmed" else "Lisa pood / ostukeskus",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = "Kõik uued asukohad läbivad modereerimise ja avaldatakse kaardil pärast administraatori heakskiitu.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (!isReviewStep) {
                // Input form
                OutlinedTextField(
                    value = name,
                    onValueChange = {
                        name = it
                        duplicateWarning = null
                    },
                    label = { Text("Poe või keskuse nimi *") },
                    placeholder = { Text("nt Mustamäe Keskus, Selver...") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = address,
                    onValueChange = {
                        address = it
                        duplicateWarning = null
                    },
                    label = { Text("Aadress *") },
                    placeholder = { Text("nt A. H. Tammsaare tee 104a") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = city,
                    onValueChange = { city = it },
                    label = { Text("Linn / Asula *") },
                    placeholder = { Text("nt Tallinn, Tartu, Pärnu...") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                // Location Type Selection
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "Asukoha tüüp:",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        LocationType.values().take(3).forEach { type ->
                            FilterChip(
                                selected = selectedType == type,
                                onClick = { selectedType = type },
                                label = { Text(type.displayName) }
                            )
                        }
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        LocationType.values().drop(3).forEach { type ->
                            FilterChip(
                                selected = selectedType == type,
                                onClick = { selectedType = type },
                                label = { Text(type.displayName) }
                            )
                        }
                    }
                }

                // Coordinates & Adjustment
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.Place, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text(
                                text = "Kaardi koordinaadid (GPS)",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Text(
                            text = "Laiuskraad: ${"%.5f".format(lat)}, Pikkuskraad: ${"%.5f".format(lng)}",
                            style = MaterialTheme.typography.bodySmall
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = {
                                    lat = initialLat
                                    lng = initialLng
                                }
                            ) {
                                Text("Lähtesta GPS asukoht")
                            }
                        }
                    }
                }

                // Duplicate warning notification if found
                duplicateWarning?.let { dup ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Icon(Icons.Default.Warning, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                                Text(
                                    text = "Sarnane asukoht on juba olemas.",
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                            }
                            Text(
                                text = "Keskus \"${dup.name}\" (${dup.address}) on juba andmebaasis. Palun kontrolli enne uue asukoha loomist.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                }

                // Next / Review Button
                Button(
                    onClick = {
                        val dup = onCheckDuplicate(name, address, lat, lng)
                        if (dup != null) {
                            duplicateWarning = dup
                        } else {
                            duplicateWarning = null
                            isReviewStep = true
                        }
                    },
                    enabled = name.isNotBlank() && address.isNotBlank() && city.isNotBlank(),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Jätka andmete ülevaatamisega")
                }
            } else {
                // Review step summary
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Andmete kokkuvõte enne esitamist:", fontWeight = FontWeight.Bold)
                        Text("Nimi: $name", style = MaterialTheme.typography.bodyMedium)
                        Text("Aadress: $address, $city", style = MaterialTheme.typography.bodyMedium)
                        Text("Tüüp: ${selectedType.displayName}", style = MaterialTheme.typography.bodyMedium)
                        Text("Koordinaadid: ${"%.5f".format(lat)}, ${"%.5f".format(lng)}", style = MaterialTheme.typography.bodyMedium)
                        Text(
                            text = "Staatus pärast esitamist: OOTEL (PENDING)",
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.SemiBold,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = { isReviewStep = false },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Muuda andmeid")
                    }
                    Button(
                        onClick = {
                            onSubmit(name, address, city, selectedType.name, lat, lng)
                            onDismiss()
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Esita kinnitamiseks")
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
