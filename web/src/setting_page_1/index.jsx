import React, { useState, useEffect } from "react";
import { Table } from "@ones-design/table";
import { useMemoizedFn } from "ahooks";
import ReactDOM from "react-dom";

const App = () => {

    const [token, setToken] = useState("");
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.dispatchEvent(new CustomEvent("ones:platform:client:sdk", {
            detail: {
                    invoke(SDK) {
                        window.SDK = SDK;
                        setToken(SDK.ONES.getAppToken());
                    }
                }
            }));
        fetchTeams();
    }, []);


    const fetchTeams = useMemoizedFn(async () => {
        setLoading(true);
        const res = await SDK.ONES.fetch("/account/teams", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await res.json();

        const teams = data?.data?.teams || [];
        teams.forEach(team => {
            team.createdAt = new Date(team.createTime/1000).toLocaleString("zh-CN", {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        });
        setTeams(teams);
        setLoading(false);
    })

    return (
        <div>
            <h1>Teams</h1>
            <button onClick={fetchTeams}>Refresh Teams</button>
            <Table
                columns={[
                    {
                        dataIndex: 'id',
                        lock: true,
                        with: 80,
                        name:'团队UUID'
                    },
                    {
                        code: 'name',
                        name: '团队名称',
                        width: 80,
                    },
                    {
                        code: 'createdAt',
                        name: '创建日期',
                        width: 150
                    },
                    {
                        code: 'owner',
                        name: '团队负责人',
                        width: 150,
                    },
                ]}
                dataSource={teams}
            />
        </div>
    )
}

ReactDOM.render(
    <App />,
    document.body.querySelector('#app')
)