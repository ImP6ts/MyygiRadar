package ee.myygi.radar.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import ee.myygi.radar.domain.model.AggregatedStatus
import ee.myygi.radar.ui.theme.StatusPresent
import ee.myygi.radar.ui.theme.StatusProbablyAbsent
import ee.myygi.radar.ui.theme.StatusProbablyPresent
import ee.myygi.radar.ui.theme.StatusUnknown

@Composable
fun StatusBadge(
    status: AggregatedStatus,
    modifier: Modifier = Modifier
) {
    val (statusColor, statusText) = when (status) {
        AggregatedStatus.PRESENT -> StatusPresent to "Kohal"
        AggregatedStatus.PROBABLY_PRESENT -> StatusProbablyPresent to "Tõenäoliselt kohal"
        AggregatedStatus.PROBABLY_ABSENT -> StatusProbablyAbsent to "Tõenäoliselt ei ole kohal"
        AggregatedStatus.UNKNOWN -> StatusUnknown to "Teadmata"
    }

    Row(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(statusColor.copy(alpha = 0.12f))
            .padding(horizontal = 10.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(statusColor)
        )
        Text(
            text = statusText,
            color = statusColor,
            style = MaterialTheme.typography.labelMedium
        )
    }
}
