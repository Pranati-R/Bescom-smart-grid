# ============================================================
# SMART GRID AI
# FULL TRAINING PIPELINE
# ============================================================
#
# MODELS:
#
# 1. TFT Forecasting Model
# 2. Transformer Theft Detection Model
# 3. GAT Graph Neural Network
#
# GPU REQUIRED
#
# ============================================================

import os
import gc
import math
import random
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd

from tqdm import tqdm

import torch
import torch.nn as nn
import torch.optim as optim

from torch.utils.data import Dataset
from torch.utils.data import DataLoader

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    mean_absolute_error
)

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("DEVICE:", DEVICE)

# ============================================================
# ============================================================
# PART 1
# TFT FORECASTING MODEL
# ============================================================
# ============================================================

# ------------------------------------------------------------
# FORECAST DATASET
# ------------------------------------------------------------

class ForecastDataset(Dataset):

    def __init__(self, X, y):

        self.X = X
        self.y = y

    def __len__(self):

        return len(self.X)

    def __getitem__(self, idx):

        return (
            self.X[idx],
            self.y[idx]
        )


# ------------------------------------------------------------
# TFT STYLE MODEL
# ------------------------------------------------------------

class TFTModel(nn.Module):

    def __init__(
        self,
        input_size,
        hidden_size=128,
        num_layers=2,
        dropout=0.2
    ):

        super().__init__()

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout
        )

        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_size,
            num_heads=4,
            batch_first=True
        )

        self.fc = nn.Sequential(

            nn.Linear(hidden_size, 128),
            nn.ReLU(),

            nn.Dropout(0.2),

            nn.Linear(128, 64),
            nn.ReLU(),

            nn.Linear(64, 1)
        )

    def forward(self, x):

        lstm_out, _ = self.lstm(x)

        attn_out, _ = self.attention(
            lstm_out,
            lstm_out,
            lstm_out
        )

        x = attn_out[:, -1, :]

        out = self.fc(x)

        return out


# ------------------------------------------------------------
# CREATE DATASET
# ------------------------------------------------------------

forecast_train_dataset = ForecastDataset(
    X_train,
    y_train
)

forecast_test_dataset = ForecastDataset(
    X_test,
    y_test
)

forecast_train_loader = DataLoader(
    forecast_train_dataset,
    batch_size=256,
    shuffle=True,
    num_workers=2,
    pin_memory=True
)

forecast_test_loader = DataLoader(
    forecast_test_dataset,
    batch_size=256,
    shuffle=False,
    num_workers=2,
    pin_memory=True
)

print("Forecast Dataloader Ready")


# ------------------------------------------------------------
# INITIALIZE MODEL
# ------------------------------------------------------------

forecast_model = TFTModel(
    input_size=X_train.shape[2]
).to(DEVICE)

criterion = nn.MSELoss()

optimizer = optim.AdamW(
    forecast_model.parameters(),
    lr=1e-3
)

scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer,
    patience=2
)

print(forecast_model)


# ------------------------------------------------------------
# TRAIN FORECAST MODEL
# ------------------------------------------------------------

EPOCHS = 10

best_loss = 999999

for epoch in range(EPOCHS):

    forecast_model.train()

    running_loss = 0

    loop = tqdm(
        forecast_train_loader,
        total=len(forecast_train_loader)
    )

    for X_batch, y_batch in loop:

        X_batch = X_batch.to(DEVICE)
        y_batch = y_batch.to(DEVICE)

        optimizer.zero_grad()

        preds = forecast_model(X_batch)

        loss = criterion(
            preds.squeeze(),
            y_batch.squeeze()
        )

        loss.backward()

        torch.nn.utils.clip_grad_norm_(
            forecast_model.parameters(),
            1.0
        )

        optimizer.step()

        running_loss += loss.item()

        loop.set_description(
            f"Forecast Epoch {epoch+1}"
        )

        loop.set_postfix(
            loss=loss.item()
        )

    epoch_loss = running_loss / len(forecast_train_loader)

    scheduler.step(epoch_loss)

    print(
        f"\nForecast Epoch {epoch+1} Loss:",
        epoch_loss
    )

    if epoch_loss < best_loss:

        best_loss = epoch_loss

        torch.save(
            forecast_model.state_dict(),
            "best_forecast_model.pth"
        )

        print("Forecast Model Saved")

print("Forecast Training Finished")


# ============================================================
# ============================================================
# PART 2
# TRANSFORMER THEFT DETECTION
# ============================================================
# ============================================================

print("\nPreparing SGCC Dataset...\n")

# ------------------------------------------------------------
# PREPARE SGCC
# ------------------------------------------------------------

sgcc_df.columns = [
    c.strip().lower()
    for c in sgcc_df.columns
]

label_col = "flag"

feature_cols = [
    c for c in sgcc_df.columns
    if c not in ["flag", "cons_no"]
]

for col in feature_cols:

    sgcc_df[col] = pd.to_numeric(
        sgcc_df[col],
        errors="coerce"
    )

sgcc_df = sgcc_df.fillna(0)


# ------------------------------------------------------------
# NORMALIZE
# ------------------------------------------------------------

from sklearn.preprocessing import StandardScaler

sgcc_scaler = StandardScaler()

sgcc_df[feature_cols] = sgcc_scaler.fit_transform(
    sgcc_df[feature_cols]
)


# ------------------------------------------------------------
# CREATE SEQUENCES
# ------------------------------------------------------------

sgcc_X = sgcc_df[feature_cols].values
sgcc_y = sgcc_df[label_col].values

sgcc_X = torch.tensor(
    sgcc_X,
    dtype=torch.float32
)

sgcc_X = sgcc_X.unsqueeze(-1)

sgcc_y = torch.tensor(
    sgcc_y,
    dtype=torch.float32
)

print("SGCC Shape:", sgcc_X.shape)


# ------------------------------------------------------------
# SPLIT
# ------------------------------------------------------------

X_train_sgcc, X_test_sgcc, y_train_sgcc, y_test_sgcc = train_test_split(
    sgcc_X,
    sgcc_y,
    test_size=0.2,
    stratify=sgcc_y,
    random_state=42
)


# ------------------------------------------------------------
# DATASET
# ------------------------------------------------------------

class TheftDataset(Dataset):

    def __init__(self, X, y):

        self.X = X
        self.y = y

    def __len__(self):

        return len(self.X)

    def __getitem__(self, idx):

        return (
            self.X[idx],
            self.y[idx]
        )


# ------------------------------------------------------------
# DATALOADER
# ------------------------------------------------------------

theft_train_loader = DataLoader(

    TheftDataset(
        X_train_sgcc,
        y_train_sgcc
    ),

    batch_size=128,
    shuffle=True,
    num_workers=2,
    pin_memory=True
)

theft_test_loader = DataLoader(

    TheftDataset(
        X_test_sgcc,
        y_test_sgcc
    ),

    batch_size=128,
    shuffle=False,
    num_workers=2,
    pin_memory=True
)

print("Theft Dataloader Ready")


# ------------------------------------------------------------
# TRANSFORMER MODEL
# ------------------------------------------------------------

class TheftTransformer(nn.Module):

    def __init__(
        self,
        input_dim=1,
        d_model=128,
        nhead=8,
        num_layers=4
    ):

        super().__init__()

        self.embedding = nn.Linear(
            input_dim,
            d_model
        )

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            batch_first=True
        )

        self.transformer = nn.TransformerEncoder(
            encoder_layer,
            num_layers=num_layers
        )

        self.classifier = nn.Sequential(

            nn.Linear(d_model, 128),
            nn.ReLU(),

            nn.Dropout(0.3),

            nn.Linear(128, 1)
        )

    def forward(self, x):

        x = self.embedding(x)

        x = self.transformer(x)

        x = x.mean(dim=1)

        out = self.classifier(x)

        return out


# ------------------------------------------------------------
# INITIALIZE
# ------------------------------------------------------------

theft_model = TheftTransformer().to(DEVICE)

criterion = nn.BCEWithLogitsLoss()

optimizer = optim.AdamW(
    theft_model.parameters(),
    lr=1e-4
)

print(theft_model)


# ------------------------------------------------------------
# TRAIN
# ------------------------------------------------------------

EPOCHS = 10

best_acc = 0

for epoch in range(EPOCHS):

    theft_model.train()

    running_loss = 0

    loop = tqdm(theft_train_loader)

    for X_batch, y_batch in loop:

        X_batch = X_batch.to(DEVICE)
        y_batch = y_batch.to(DEVICE)

        optimizer.zero_grad()

        preds = theft_model(X_batch)

        loss = criterion(
            preds.squeeze(),
            y_batch
        )

        loss.backward()

        torch.nn.utils.clip_grad_norm_(
            theft_model.parameters(),
            1.0
        )

        optimizer.step()

        running_loss += loss.item()

        loop.set_description(
            f"Theft Epoch {epoch+1}"
        )

        loop.set_postfix(
            loss=loss.item()
        )

    print(
        f"\nTheft Epoch {epoch+1} Loss:",
        running_loss / len(theft_train_loader)
    )

    # --------------------------------------------------------
    # EVALUATION
    # --------------------------------------------------------

    theft_model.eval()

    all_preds = []
    all_labels = []

    with torch.no_grad():

        for X_batch, y_batch in theft_test_loader:

            X_batch = X_batch.to(DEVICE)

            preds = theft_model(X_batch)

            preds = torch.sigmoid(preds)

            preds = (preds > 0.5).float()

            all_preds.extend(
                preds.cpu().numpy().flatten()
            )

            all_labels.extend(
                y_batch.numpy().flatten()
            )

    acc = accuracy_score(
        all_labels,
        all_preds
    )

    print("Accuracy:", acc)

    if acc > best_acc:

        best_acc = acc

        torch.save(
            theft_model.state_dict(),
            "best_theft_model.pth"
        )

        print("Theft Model Saved")

print("Theft Training Finished")


# ============================================================
# ============================================================
# PART 3
# GNN PEER INTELLIGENCE
# ============================================================
# ============================================================

print("\nPreparing Graph Dataset...\n")

# ------------------------------------------------------------
# INSTALL TORCH GEOMETRIC
# ------------------------------------------------------------

# RUN SEPARATELY IF NEEDED:
#
# !pip install torch-geometric


# ------------------------------------------------------------
# IMPORTS
# ------------------------------------------------------------

from torch_geometric.data import Data
from torch_geometric.nn import GATConv


# ------------------------------------------------------------
# CREATE SYNTHETIC GRAPH
# ------------------------------------------------------------

unique_meters = meter_df["meter_id"].unique()

meter_to_idx = {
    meter: idx
    for idx, meter in enumerate(unique_meters)
}

# ------------------------------------------------------------
# NODE FEATURES
# ------------------------------------------------------------

node_features = []

for meter in unique_meters:

    meter_data = meter_df[
        meter_df["meter_id"] == meter
    ]

    mean_usage = meter_data["kwh"].mean()

    std_usage = meter_data["kwh"].std()

    peak_usage = meter_data["kwh"].max()

    node_features.append([
        mean_usage,
        std_usage,
        peak_usage
    ])

node_features = torch.tensor(
    node_features,
    dtype=torch.float
)

print("Node Features:", node_features.shape)


# ------------------------------------------------------------
# CREATE EDGES
# ------------------------------------------------------------

edge_index = []

meters_list = list(unique_meters)

for i in range(len(meters_list)-1):

    edge_index.append([i, i+1])
    edge_index.append([i+1, i])

edge_index = torch.tensor(
    edge_index,
    dtype=torch.long
).t().contiguous()

print("Edges:", edge_index.shape)


# ------------------------------------------------------------
# SYNTHETIC LABELS
# ------------------------------------------------------------

labels = []

for meter in unique_meters:

    meter_data = meter_df[
        meter_df["meter_id"] == meter
    ]

    avg = meter_data["kwh"].mean()

    if avg < 0.1:
        labels.append(1)
    else:
        labels.append(0)

labels = torch.tensor(labels)

print("Labels:", labels.shape)


# ------------------------------------------------------------
# GRAPH DATA
# ------------------------------------------------------------

graph_data = Data(
    x=node_features,
    edge_index=edge_index,
    y=labels
).to(DEVICE)

print(graph_data)


# ------------------------------------------------------------
# GAT MODEL
# ------------------------------------------------------------

class GATModel(nn.Module):

    def __init__(self):

        super().__init__()

        self.gat1 = GATConv(
            3,
            64,
            heads=4,
            dropout=0.2
        )

        self.gat2 = GATConv(
            64*4,
            64,
            heads=4,
            dropout=0.2
        )

        self.fc = nn.Linear(
            64*4,
            2
        )

    def forward(self, data):

        x, edge_index = data.x, data.edge_index

        x = self.gat1(x, edge_index)

        x = torch.relu(x)

        x = self.gat2(x, edge_index)

        x = torch.relu(x)

        x = self.fc(x)

        return x


# ------------------------------------------------------------
# INITIALIZE
# ------------------------------------------------------------

gat_model = GATModel().to(DEVICE)

optimizer = optim.AdamW(
    gat_model.parameters(),
    lr=1e-3
)

criterion = nn.CrossEntropyLoss()

print(gat_model)


# ------------------------------------------------------------
# TRAIN
# ------------------------------------------------------------

EPOCHS = 50

best_loss = 99999

for epoch in range(EPOCHS):

    gat_model.train()

    optimizer.zero_grad()

    out = gat_model(graph_data)

    loss = criterion(
        out,
        graph_data.y
    )

    loss.backward()

    optimizer.step()

    print(
        f"GNN Epoch {epoch+1} Loss:",
        loss.item()
    )

    if loss.item() < best_loss:

        best_loss = loss.item()

        torch.save(
            gat_model.state_dict(),
            "best_gnn_model.pth"
        )

        print("GNN Model Saved")

print("GNN Training Finished")


# ============================================================
# SAVE EVERYTHING
# ============================================================

torch.save(
    forecast_model.state_dict(),
    "final_forecast_model.pth"
)

torch.save(
    theft_model.state_dict(),
    "final_theft_model.pth"
)

torch.save(
    gat_model.state_dict(),
    "final_gnn_model.pth"
)

print("\nALL MODELS TRAINED SUCCESSFULLY")
print("FILES SAVED")