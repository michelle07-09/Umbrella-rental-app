import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { supabase } from '../supabase';

export default function RentalScreen({ route }) {
  const { rental } = route.params;
  const [ended, setEnded] = useState(false);

  async function endRental() {
    const endTime = new Date();
    const startTime = new Date(rental.start_time);
    const diffMs = endTime - startTime;
    const diffHours = diffMs / (1000 * 60 * 60);

    let extraCharge = 0;
    if (diffHours > 1) {
      extraCharge = (diffHours - 1) * 5;
    }

    let { error } = await supabase.from('rentals')
      .update({ end_time: endTime, active: false, extra_charge: extraCharge })
      .eq('id', rental.id);

    if (error) Alert.alert("Error", error.message);
    else {
      setEnded(true);
      Alert.alert("Rental Ended", `Extra charge: $${extraCharge}`);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {!ended ? (
        <Button title="End Rental" onPress={endRental} />
      ) : (
        <Text>Rental closed successfully.</Text>
      )}
    </View>
  );
}